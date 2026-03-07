// ============================================
// 🎯 Safety Talk Registration System (Simplified)
// ============================================
// ไม่มีฐานข้อมูลพนักงาน - ให้คนกรอกเองตอนลงทะเบียน
// ============================================

// Use global variables (loaded from index.html)
const { useState, useRef, useEffect } = window;
const { Camera, MapPin, Clock, CheckCircle, XCircle, Download, BarChart3, Calendar } = window;

// Firebase Mock - ใช้ LocalStorage
class FirebaseMock {
  constructor() {
    this.data = {
      attendances: [],
      settings: {}
    };
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('safety-talk-data');
      if (stored) {
        this.data = JSON.parse(stored);
      }
    } catch (e) {
      console.log('No stored data');
    }
  }

  saveToStorage() {
    localStorage.setItem('safety-talk-data', JSON.stringify(this.data));
  }

  collection(name) {
    return {
      add: async (data) => {
        const id = Date.now().toString() + Math.random().toString(36);
        const item = { ...data, id, createdAt: new Date().toISOString() };
        this.data[name] = this.data[name] || [];
        this.data[name].push(item);
        this.saveToStorage();
        return { id };
      },
      get: async () => {
        return {
          docs: (this.data[name] || []).map(item => ({
            id: item.id,
            data: () => item
          }))
        };
      },
      doc: (id) => ({
        set: async (data) => {
          this.data[name] = this.data[name] || [];
          const index = this.data[name].findIndex(item => item.id === id);
          if (index >= 0) {
            this.data[name][index] = { ...data, id };
          } else {
            this.data[name].push({ ...data, id });
          }
          this.saveToStorage();
        },
        get: async () => {
          const item = (this.data[name] || []).find(item => item.id === id);
          return {
            exists: !!item,
            data: () => item
          };
        },
        delete: async () => {
          this.data[name] = (this.data[name] || []).filter(item => item.id !== id);
          this.saveToStorage();
        }
      })
    };
  }
}

const db = new FirebaseMock();

// Helper: Compress image
const compressImage = (file, maxWidth = 800) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Component: Registration Form
const RegistrationForm = ({ locationId, onSuccess }) => {
  const [formData, setFormData] = useState({
    employeeCode: '',
    fullName: '',
    position: '',
    department: ''
  });
  const [photo, setPhoto] = useState(null);
  const [gps, setGps] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Get GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGps({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('GPS Error:', error);
        }
      );
    }
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError('ไม่สามารถเปิดกล้องได้');
    }
  };

  // Take photo
  const takePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setPhoto(canvas.toDataURL('image/jpeg', 0.7));
    
    // Stop camera
    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    setCameraActive(false);
  };

  // Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    
    if (!photo) {
      setError('กรุณาถ่ายรูป');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await db.collection('attendances').add({
        employeeCode: formData.employeeCode.trim(),
        fullName: formData.fullName.trim(),
        position: formData.position.trim() || '-',
        department: formData.department.trim() || '-',
        locationId: locationId || 'unknown',
        photo: photo,
        gps: gps,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
      });

      onSuccess();
      
      // Reset form
      setFormData({
        employeeCode: '',
        fullName: '',
        position: '',
        department: ''
      });
      setPhoto(null);
      
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Form Fields */}
        <div className="bg-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-emerald-400 mb-4">
            📝 กรอกข้อมูลของคุณ
          </h3>

          {/* Employee Code (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              รหัสพนักงาน <span className="text-slate-500">(ถ้ามี)</span>
            </label>
            <input
              type="text"
              value={formData.employeeCode}
              onChange={(e) => setFormData({...formData, employeeCode: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              placeholder="12345"
            />
          </div>

          {/* Full Name (Required) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ชื่อ - นามสกุล <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              placeholder="นายสมชาย ใจดี"
              required
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ตำแหน่ง
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              placeholder="ช่างไฟฟ้า"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              สังกัด / แผนก
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              placeholder="ผกส. / กฟจ.ลำพูน"
            />
          </div>
        </div>

        {/* Photo Section */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-emerald-400 mb-4">
            📸 ถ่ายรูปยืนยันตัวตน <span className="text-red-400">*</span>
          </h3>

          {!photo ? (
            <div className="space-y-4">
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg flex items-center justify-center space-x-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>เปิดกล้อง</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={takePhoto}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg"
                  >
                    ถ่ายรูป
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <img src={photo} alt="Photo" className="w-full rounded-lg" />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
              >
                ถ่ายใหม่
              </button>
            </div>
          )}
        </div>

        {/* GPS Info */}
        {gps && (
          <div className="bg-slate-800 rounded-xl p-4 flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <div className="text-sm text-slate-300">
              ตำแหน่ง: {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white font-bold rounded-lg text-lg"
        >
          {loading ? 'กำลังบันทึก...' : '✅ ลงทะเบียน'}
        </button>
      </form>
    </div>
  );
};

// Component: Reports
const ReportsView = () => {
  const [attendances, setAttendances] = useState([]);
  const [filter, setFilter] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    const result = await db.collection('attendances').get();
    const data = result.docs.map(doc => doc.data());
    
    // Filter by date
    const filtered = data.filter(item => {
      const itemDate = item.date;
      return itemDate >= filter.startDate && itemDate <= filter.endDate;
    });
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    setAttendances(filtered);
  };

  // Export to Excel
  const exportToExcel = () => {
    const csv = [
      ['วันที่', 'เวลา', 'รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ตำแหน่ง', 'สังกัด/แผนก', 'GPS'],
      ...attendances.map(item => [
        new Date(item.timestamp).toLocaleDateString('th-TH'),
        new Date(item.timestamp).toLocaleTimeString('th-TH'),
        item.employeeCode || '-',
        item.fullName,
        item.position,
        item.department,
        item.gps ? `${item.gps.latitude},${item.gps.longitude}` : '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `safety-talk-${filter.startDate}-to-${filter.endDate}.csv`;
    link.click();
  };

  // Group by date
  const groupedByDate = attendances.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      
      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-emerald-400 mb-4">📅 เลือกช่วงเวลา</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">จากวันที่</label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter({...filter, startDate: e.target.value})}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">ถึงวันที่</label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter({...filter, endDate: e.target.value})}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="text-3xl font-black mb-1">{attendances.length}</div>
          <div className="text-sm opacity-90">ลงทะเบียนทั้งหมด</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="text-3xl font-black mb-1">{Object.keys(groupedByDate).length}</div>
          <div className="text-sm opacity-90">จำนวนวัน</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="text-3xl font-black mb-1">
            {attendances.length > 0 ? Math.round(attendances.length / Math.max(Object.keys(groupedByDate).length, 1)) : 0}
          </div>
          <div className="text-sm opacity-90">เฉลี่ยต่อวัน</div>
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={exportToExcel}
        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg flex items-center justify-center space-x-2"
      >
        <Download className="w-5 h-5" />
        <span>Export Excel ({attendances.length} รายการ)</span>
      </button>

      {/* Data by Date */}
      <div className="space-y-4">
        {Object.keys(groupedByDate).sort().reverse().map(date => (
          <div key={date} className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-emerald-400 mb-4">
              📅 {new Date(date + 'T00:00:00').toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} ({groupedByDate[date].length} คน)
            </h3>
            
            <div className="space-y-3">
              {groupedByDate[date].map((item, idx) => (
                <div key={idx} className="bg-slate-900 rounded-lg p-4 flex items-start space-x-4">
                  {/* Photo */}
                  {item.photo && (
                    <img 
                      src={item.photo} 
                      alt="Photo" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="font-bold text-white">{item.fullName}</div>
                    <div className="text-sm text-slate-400 space-y-1 mt-1">
                      {item.employeeCode && (
                        <div>รหัส: {item.employeeCode}</div>
                      )}
                      <div>ตำแหน่ง: {item.position}</div>
                      <div>สังกัด: {item.department}</div>
                      <div className="text-xs text-slate-500">
                        เวลา: {new Date(item.timestamp).toLocaleTimeString('th-TH')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {attendances.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          ไม่มีข้อมูลในช่วงเวลาที่เลือก
        </div>
      )}
    </div>
  );
};

// Main App
const SafetyTalkApp = () => {
  const [currentView, setCurrentView] = useState('register');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRegistrationSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-emerald-400 mb-2">
            Safety Talk
          </h1>
          <p className="text-slate-400">ระบบลงทะเบียนเข้าร่วมกิจกรรม</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setCurrentView('register')}
            className={`px-6 py-3 rounded-lg font-bold ${
              currentView === 'register'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            📝 ลงทะเบียน
          </button>
          <button
            onClick={() => setCurrentView('reports')}
            className={`px-6 py-3 rounded-lg font-bold ${
              currentView === 'reports'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            📊 รายงาน
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed top-4 right-4 bg-emerald-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 animate-bounce">
            <CheckCircle className="w-6 h-6" />
            <span className="font-bold">ลงทะเบียนสำเร็จ!</span>
          </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {currentView === 'register' && (
            <RegistrationForm 
              locationId="lampun"
              onSuccess={handleRegistrationSuccess}
            />
          )}
          
          {currentView === 'reports' && (
            <ReportsView />
          )}
        </div>

      </div>
    </div>
  );
};

// Make SafetyTalkApp available globally
window.SafetyTalkApp = SafetyTalkApp;
