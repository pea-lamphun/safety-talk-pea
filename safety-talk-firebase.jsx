import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Clock, Users, CheckCircle, XCircle, Calendar, TrendingUp, AlertCircle, Settings, QrCode, Download, Upload, UserPlus, Edit2, Trash2, Search, FileText, BarChart3, Filter } from 'lucide-react';

// ============ FIREBASE CONFIGURATION ============
// 🔥 STEP 1: แทนที่ค่าเหล่านี้ด้วย Firebase Config ของคุณ
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBRgmrCDHmiURSKJayo6h9yL4t3kUD5SxQ",
  authDomain: "safety-talk-pea.firebaseapp.com",
  projectId: "safety-talk-pea",
  storageBucket: "safety-talk-pea.firebasestorage.app",
  messagingSenderId: "340855934706",
  appId: "1:340855934706:web:78f965402525bfe3390a6b"
};

// ============ FIREBASE MOCK (สำหรับ Demo - จะใช้ Firebase จริงเมื่อ Deploy) ============
class FirebaseMock {
  constructor() {
    this.data = {
      employees: {},
      attendances: {},
      locations: {}
    };
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('firebase-data');
      if (stored) {
        this.data = JSON.parse(stored);
      }
    } catch (e) {
      console.log('No stored data');
    }
  }

  saveToStorage() {
    localStorage.setItem('firebase-data', JSON.stringify(this.data));
  }

  async collection(name) {
    return {
      add: async (data) => {
        const id = Date.now().toString();
        this.data[name] = this.data[name] || {};
        this.data[name][id] = { ...data, id };
        this.saveToStorage();
        return { id };
      },
      doc: (id) => ({
        set: async (data) => {
          this.data[name] = this.data[name] || {};
          this.data[name][id] = { ...data, id };
          this.saveToStorage();
        },
        get: async () => ({
          exists: () => !!this.data[name]?.[id],
          data: () => this.data[name]?.[id]
        }),
        update: async (data) => {
          if (this.data[name]?.[id]) {
            this.data[name][id] = { ...this.data[name][id], ...data };
            this.saveToStorage();
          }
        },
        delete: async () => {
          if (this.data[name]?.[id]) {
            delete this.data[name][id];
            this.saveToStorage();
          }
        }
      }),
      get: async () => ({
        docs: Object.values(this.data[name] || {}).map(doc => ({
          id: doc.id,
          data: () => doc
        }))
      }),
      where: (field, op, value) => ({
        get: async () => ({
          docs: Object.values(this.data[name] || {})
            .filter(doc => {
              if (op === '==') return doc[field] === value;
              if (op === '!=') return doc[field] !== value;
              if (op === '>') return doc[field] > value;
              if (op === '<') return doc[field] < value;
              return true;
            })
            .map(doc => ({
              id: doc.id,
              data: () => doc
            }))
        })
      })
    };
  }
}

const db = new FirebaseMock();

// ============ CONFIGURATION ============
const LOCATIONS = {
  'lampun': {
    id: 'lampun',
    name: 'กฟจ.ลำพูน',
    fullName: 'การไฟฟ้าส่วนภูมิภาคจังหวัดลำพูน',
    lat: 18.5745,
    lng: 99.0087,
    color: '#10b981'
  },
  'pasang': {
    id: 'pasang',
    name: 'กฟส.ป่าซาง',
    fullName: 'การไฟฟ้าส่วนภูมิภาคสาขาป่าซาง',
    lat: 18.5235,
    lng: 98.9394,
    color: '#3b82f6'
  },
  'banhong': {
    id: 'banhong',
    name: 'กฟส.บ้านโฮ่ง',
    fullName: 'การไฟฟ้าส่วนภูมิภาคสาขาบ้านโฮ่ง',
    lat: 18.7367,
    lng: 98.9436,
    color: '#8b5cf6'
  },
  'li': {
    id: 'li',
    name: 'กฟส.ลี้',
    fullName: 'การไฟฟ้าส่วนภูมิภาคสาขาลี้',
    lat: 18.2773,
    lng: 99.0534,
    color: '#f59e0b'
  },
  'banthi': {
    id: 'banthi',
    name: 'กฟส.บ้านธิ',
    fullName: 'การไฟฟ้าส่วนภูมิภาคสาขาบ้านธิ',
    lat: 18.4156,
    lng: 99.1367,
    color: '#ec4899'
  },
  'maeta': {
    id: 'maeta',
    name: 'กฟส.แม่ทา',
    fullName: 'การไฟฟ้าส่วนภูมิภาคสาขาแม่ทา',
    lat: 18.1856,
    lng: 99.2678,
    color: '#14b8a6'
  },
  'nakornchadee': {
    id: 'nakornchadee',
    name: 'กฟส.นครเจดีย์',
    fullName: 'การไฟฟ้าส่วนภูมิภาคสาขานครเจดีย์',
    lat: 18.3456,
    lng: 99.5134,
    color: '#06b6d4'
  },
  'wiangnonglong': {
    id: 'wiangnonglong',
    name: 'กฟส.เวียงหนองล่อง',
    fullName: 'การไฟฟ้าส่วนภูมิภาคสาขาเวียงหนองล่อง',
    lat: 18.6523,
    lng: 99.2134,
    color: '#a855f7'
  },
  'thunghuachang': {
    id: 'thunghuachang',
    name: 'กฟส.ทุ่งหัวช้าง',
    fullName: 'การไฟฟ้าส่วนภูมิภาคสาขาทุ่งหัวช้าง',
    lat: 18.4012,
    lng: 99.3245,
    color: '#f97316'
  },
  'maetuen': {
    id: 'maetuen',
    name: 'กฟส.แม่ตืน',
    fullName: 'การไฟฟ้าส่วนภูมิภาคสาขาแม่ตืน',
    lat: 18.1234,
    lng: 99.4567,
    color: '#84cc16'
  }
};

const CONFIG = {
  maxDistance: 30,
  allowedTime: {
    start: "08:00",
    end: "09:30"
  }
};

// ============ HELPER FUNCTIONS ============
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const isWithinTimeRange = (startTime, endTime) => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime >= startTime && currentTime <= endTime;
};

const formatThaiDateTime = (date) => {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(date).toLocaleDateString('th-TH', options);
};

// ============ IMAGE COMPRESSION ============
const compressImage = (base64String, maxWidth = 400, quality = 0.3) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // คำนวณขนาดใหม่ (ลดความละเอียด)
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // วาดรูปด้วยคุณภาพต่ำ
      ctx.drawImage(img, 0, 0, width, height);
      
      // แปลงเป็น JPEG คุณภาพต่ำมาก
      const compressed = canvas.toDataURL('image/jpeg', quality);
      
      console.log(`📸 Compressed: ${(base64String.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB`);
      resolve(compressed);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64String;
  });
};

// ============ AUTO DELETE OLD PHOTOS ============
const cleanupOldPhotos = async () => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const snapshot = await db.collection('attendances')
      .where('timestamp', '<', threeMonthsAgo.toISOString())
      .get();
    
    let deletedCount = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.photo) {
        // ลบเฉพาะรูป เก็บข้อมูลอื่นไว้
        await db.collection('attendances').doc(doc.id).update({
          photo: null,
          photoDeleted: true,
          photoDeletedAt: new Date().toISOString()
        });
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`🗑️ ลบรูปเก่า ${deletedCount} รูป (เก่ากว่า 3 เดือน)`);
    }
  } catch (error) {
    console.error('Error cleaning up old photos:', error);
  }
};

// ============ MAIN APP COMPONENT ============
export default function SafetyTalkRegistration() {
  const [view, setView] = useState('scan');
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState('lampun');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locationParam = params.get('location');
    if (locationParam && LOCATIONS[locationParam]) {
      setCurrentLocation(locationParam);
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // ลบรูปเก่าอัตโนมัติ (รันทุกครั้งที่เปิดแอพ)
      cleanupOldPhotos();
      
      const [empSnapshot, attSnapshot] = await Promise.all([
        db.collection('employees').get(),
        db.collection('attendances').get()
      ]);
      
      const empData = empSnapshot.docs.map(doc => doc.data());
      const attData = attSnapshot.docs.map(doc => doc.data());
      
      setEmployees(empData);
      setAttendances(attData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAttendance = async (attendance) => {
    try {
      await db.collection('attendances').add(attendance);
      setAttendances([...attendances, attendance]);
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-emerald-400 text-xl font-bold animate-pulse">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/80 backdrop-blur-lg border-b border-emerald-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-500/20 p-2.5 rounded-xl">
                <QrCode className="text-emerald-400" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-emerald-400 tracking-tight leading-tight">
                  Safety Talk
                </h1>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-slate-400 font-semibold text-xs">Registration System</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400 font-bold text-sm">{LOCATIONS[currentLocation].name}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setView('scan')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  view === 'scan' 
                    ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/50' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <Camera size={20} className="inline mr-2" />
                ลงทะเบียน
              </button>
              <button
                onClick={() => setView('employees')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  view === 'employees' 
                    ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/50' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <Users size={20} className="inline mr-2" />
                จัดการพนักงาน
              </button>
              <button
                onClick={() => setView('reports')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  view === 'reports' 
                    ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/50' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <BarChart3 size={20} className="inline mr-2" />
                รายงาน
              </button>
              <button
                onClick={() => setView('settings')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  view === 'settings' 
                    ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/50' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {view === 'scan' && <ScanView onRegister={saveAttendance} currentLocation={currentLocation} employees={employees} />}
        {view === 'employees' && <EmployeeManagement employees={employees} setEmployees={setEmployees} currentLocation={currentLocation} />}
        {view === 'reports' && <ReportsView attendances={attendances} employees={employees} currentLocation={currentLocation} />}
        {view === 'settings' && <SettingsView currentLocation={currentLocation} setCurrentLocation={setCurrentLocation} />}
      </div>
    </div>
  );
}

// ============ SCAN VIEW COMPONENT ============
function ScanView({ onRegister, currentLocation, employees }) {
  const [step, setStep] = useState('select');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [cameraMode, setCameraMode] = useState('user');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const locationConfig = LOCATIONS[currentLocation];
  const locationEmployees = employees.filter(e => e.locationId === currentLocation);
  const filteredEmployees = locationEmployees.filter(e => 
    `${e.prefix}${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: cameraMode, width: 1280, height: 720 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOpen(true);
      }
    } catch (err) {
      alert('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      // แปลงเป็น base64 คุณภาพปกติก่อน
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Compress สุดๆ: ขนาด 400px, คุณภาพ 30%
      const compressed = await compressImage(photoData, 400, 0.3);
      
      setPhoto(compressed);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  const checkLocationAndProceed = async () => {
    setIsChecking(true);
    setError('');

    if (!isWithinTimeRange(CONFIG.allowedTime.start, CONFIG.allowedTime.end)) {
      setError(`ลงทะเบียนได้เฉพาะเวลา ${CONFIG.allowedTime.start} - ${CONFIG.allowedTime.end} น. เท่านั้น`);
      setStep('error');
      setIsChecking(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('เบราว์เซอร์ของคุณไม่รองรับ GPS');
      setStep('error');
      setIsChecking(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const distance = calculateDistance(userLat, userLng, locationConfig.lat, locationConfig.lng);

        const locationData = {
          lat: userLat,
          lng: userLng,
          distance: distance.toFixed(2)
        };

        if (distance > CONFIG.maxDistance) {
          setError(`คุณอยู่ห่างจากจุดกิจกรรม ${distance.toFixed(0)} เมตร (อนุญาตไม่เกิน ${CONFIG.maxDistance} เมตร)`);
          setStep('error');
          setIsChecking(false);
          return;
        }

        const attendance = {
          employeeId: selectedEmployee.id,
          employeeName: `${selectedEmployee.prefix}${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
          department: selectedEmployee.department,
          team: selectedEmployee.team,
          timestamp: new Date().toISOString(),
          location: locationData,
          locationId: currentLocation,
          locationName: locationConfig.name,
          photo: photo,
          distance: locationData.distance
        };

        await onRegister(attendance);
        setLocation(locationData);
        setStep('success');
        setIsChecking(false);
      },
      (err) => {
        setError('ไม่สามารถตรวจสอบตำแหน่งได้ กรุณาเปิด GPS และอนุญาตการเข้าถึงตำแหน่ง');
        setStep('error');
        setIsChecking(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const reset = () => {
    setStep('select');
    setSelectedEmployee(null);
    setSearchTerm('');
    setLocation(null);
    setPhoto(null);
    setError('');
    setCameraMode('user');
    setIsCameraOpen(false);
    stopCamera();
  };

  // Select Employee Step
  if (step === 'select') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-block bg-emerald-500/20 p-4 rounded-full mb-4">
              <Users size={48} className="text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-3">ลงทะเบียนเข้าร่วมกิจกรรม Safety Talk</h2>
            
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/40 px-6 py-3 rounded-xl mt-4">
              <MapPin size={20} className="text-emerald-400" />
              <div className="text-left">
                <div className="text-emerald-400 font-black text-lg leading-tight">
                  {locationConfig.name}
                </div>
                <div className="text-slate-300 text-xs font-semibold">
                  {locationConfig.fullName}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-emerald-400 font-bold mb-2 text-sm uppercase tracking-wide">
                <Search size={16} className="inline mr-1" />
                ค้นหาชื่อ-นามสกุล
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/50 border-2 border-slate-700 text-white px-4 py-3 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors text-lg"
                placeholder="พิมพ์เพื่อค้นหา..."
              />
            </div>

            <div className="bg-slate-900/50 rounded-lg max-h-96 overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-semibold">ไม่พบรายชื่อพนักงาน</p>
                  <p className="text-sm mt-2">กรุณาเพิ่มพนักงานในเมนู "จัดการพนักงาน"</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {filteredEmployees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setStep('photo');
                      }}
                      className="w-full p-4 hover:bg-slate-800 transition-colors text-left flex items-center justify-between"
                    >
                      <div>
                        <div className="text-white font-bold text-lg">
                          {emp.prefix}{emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {emp.department} - {emp.team}
                        </div>
                      </div>
                      <div className="text-emerald-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-4">
              <h3 className="text-white font-bold mb-3 flex items-center">
                <AlertCircle size={20} className="text-yellow-400 mr-2" />
                ข้อกำหนดในการลงทะเบียน
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start">
                  <Clock size={16} className="text-emerald-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>เวลา: {CONFIG.allowedTime.start} - {CONFIG.allowedTime.end} น.</span>
                </li>
                <li className="flex items-start">
                  <MapPin size={16} className="text-emerald-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>ตำแหน่ง: ต้องอยู่ภายในรัศมี 20 เมตร จากจุดลงทะเบียน</span>
                </li>
                <li className="flex items-start">
                  <Camera size={16} className="text-emerald-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>ต้องถ่ายรูปยืนยันตัวตน</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Photo Step
  if (step === 'photo') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-white mb-2">ถ่ายรูปยืนยันตัวตน</h2>
            <p className="text-slate-400">
              {selectedEmployee.prefix}{selectedEmployee.firstName} {selectedEmployee.lastName}
            </p>
            <p className="text-emerald-400 text-sm">
              {selectedEmployee.department} - {selectedEmployee.team}
            </p>
          </div>

          <div className="space-y-4">
            {!photo && !isCameraOpen && (
              <button
                onClick={startCamera}
                className="w-full bg-slate-700 border-2 border-slate-600 text-white font-bold py-4 rounded-lg hover:bg-slate-600 transition-all flex items-center justify-center"
              >
                <Camera size={20} className="mr-2" />
                เปิดกล้องถ่ายรูป
              </button>
            )}

            {isCameraOpen && !photo && (
              <div className="space-y-3">
                <div className="relative bg-slate-900 rounded-xl overflow-hidden">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
                  <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-xl pointer-events-none"></div>
                  
                  <button
                    onClick={() => {
                      const newMode = cameraMode === 'user' ? 'environment' : 'user';
                      setCameraMode(newMode);
                      setTimeout(() => startCamera(), 100);
                    }}
                    className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm text-white p-3 rounded-lg hover:bg-slate-800 transition-colors border border-emerald-500/30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                      <path d="M21 3v5h-5"/>
                    </svg>
                  </button>

                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <p className="text-white text-sm bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-full">
                      {cameraMode === 'user' ? '📷 กล้องหน้า' : '📷 กล้องหลัง'}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      stopCamera();
                      setStep('select');
                    }}
                    className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-900 font-black py-3 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all"
                  >
                    <Camera size={20} className="inline mr-2" />
                    ถ่ายรูป
                  </button>
                </div>
              </div>
            )}

            {photo && (
              <div className="space-y-3">
                <div className="relative bg-slate-900 rounded-xl overflow-hidden">
                  <img src={photo} alt="Captured" className="w-full h-auto rounded-xl" />
                  <div className="absolute top-4 right-4 bg-emerald-500/90 text-slate-900 px-3 py-1 rounded-full text-sm font-bold">
                    ✓ ถ่ายแล้ว
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={retakePhoto}
                    className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    ถ่ายใหม่
                  </button>
                  <button
                    onClick={checkLocationAndProceed}
                    disabled={isChecking}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-900 font-black py-3 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50"
                  >
                    {isChecking ? 'กำลังตรวจสอบ...' : 'ลงทะเบียน'}
                  </button>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      </div>
    );
  }

  // Success Step
  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-8 shadow-2xl text-center">
          <div className="inline-block bg-emerald-500/20 p-6 rounded-full mb-6 animate-pulse">
            <CheckCircle size={64} className="text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3">ลงทะเบียนสำเร็จ!</h2>
          <p className="text-emerald-400 font-bold text-xl mb-2">✓ บันทึกข้อมูลเรียบร้อยแล้ว</p>
          <p className="text-slate-300 mb-6">ขอบคุณที่เข้าร่วมกิจกรรม Safety Talk</p>
          
          <div className="bg-slate-900/50 rounded-lg p-6 mb-6 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-slate-500 text-sm font-bold mb-1">ชื่อ-นามสกุล</p>
                <p className="text-white text-lg">{selectedEmployee.prefix}{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold mb-1">หน่วยงาน</p>
                <p className="text-emerald-400 font-bold text-lg">{locationConfig.name}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold mb-1">ระยะห่าง</p>
                <p className="text-emerald-400 font-bold text-lg">{location.distance} ม.</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 text-sm font-bold mb-1">เวลาลงทะเบียน</p>
                <p className="text-white text-lg">{formatThaiDateTime(new Date())}</p>
              </div>
            </div>
          </div>

          <button
            onClick={reset}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-900 font-black py-4 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all text-lg"
          >
            ลงทะเบียนคนถัดไป
          </button>
        </div>
      </div>
    );
  }

  // Error Step
  if (step === 'error') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-lg border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center">
          <div className="inline-block bg-red-500/20 p-6 rounded-full mb-6">
            <XCircle size={64} className="text-red-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3">ไม่สามารถลงทะเบียนได้</h2>
          <p className="text-red-400 mb-6 text-lg font-semibold">{error}</p>
          
          <button
            onClick={reset}
            className="w-full bg-slate-700 text-white font-bold py-4 rounded-lg hover:bg-slate-600 transition-colors text-lg"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ============ EMPLOYEE MANAGEMENT COMPONENT ============
function EmployeeManagement({ employees, setEmployees, currentLocation }) {
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    prefix: 'นาย',
    firstName: '',
    lastName: '',
    department: '',
    team: '',
    locationId: currentLocation
  });

  const locationEmployees = employees.filter(e => e.locationId === currentLocation);
  const filteredEmployees = locationEmployees.filter(e =>
    `${e.prefix}${e.firstName} ${e.lastName} ${e.department} ${e.team}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await db.collection('employees').doc(editingEmployee.id).update(formData);
        setEmployees(employees.map(emp => emp.id === editingEmployee.id ? { ...emp, ...formData } : emp));
      } else {
        const docRef = await db.collection('employees').add(formData);
        setEmployees([...employees, { ...formData, id: docRef.id }]);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('ต้องการลบพนักงานคนนี้?')) {
      try {
        await db.collection('employees').doc(id).delete();
        setEmployees(employees.filter(emp => emp.id !== id));
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      prefix: employee.prefix,
      firstName: employee.firstName,
      lastName: employee.lastName,
      department: employee.department,
      team: employee.team,
      locationId: employee.locationId
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
    setFormData({
      prefix: 'นาย',
      firstName: '',
      lastName: '',
      department: '',
      team: '',
      locationId: currentLocation
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white flex items-center">
            <Users size={28} className="text-emerald-400 mr-3" />
            จัดการรายชื่อพนักงาน
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-500 text-slate-900 font-bold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center"
          >
            <UserPlus size={20} className="mr-2" />
            เพิ่มพนักงาน
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-slate-900/50 rounded-lg p-6 mb-6">
            <h3 className="text-white font-bold mb-4">{editingEmployee ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-2 text-sm">คำนำหน้า</label>
                <select
                  value={formData.prefix}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:border-emerald-500 focus:outline-none"
                >
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-2 text-sm">หน่วยงาน</label>
                <select
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:border-emerald-500 focus:outline-none"
                >
                  {Object.values(LOCATIONS).map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-2 text-sm">ชื่อ</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-2 text-sm">นามสกุล</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-2 text-sm">แผนก</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:border-emerald-500 focus:outline-none"
                  placeholder="เช่น ผกส."
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-2 text-sm">ชุดงาน</label>
                <input
                  type="text"
                  value={formData.team}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:border-emerald-500 focus:outline-none"
                  placeholder="เช่น ก่อสร้าง 1"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-slate-700 text-white font-bold py-2 rounded-lg hover:bg-slate-600 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-500 text-slate-900 font-bold py-2 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all"
              >
                {editingEmployee ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน'}
              </button>
            </div>
          </form>
        )}

        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-2 rounded-lg focus:border-emerald-500 focus:outline-none"
            placeholder="🔍 ค้นหาพนักงาน..."
          />
        </div>

        <div className="bg-slate-900/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-emerald-400 font-bold">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3 text-left text-emerald-400 font-bold">แผนก</th>
                  <th className="px-4 py-3 text-left text-emerald-400 font-bold">ชุดงาน</th>
                  <th className="px-4 py-3 text-left text-emerald-400 font-bold">หน่วยงาน</th>
                  <th className="px-4 py-3 text-center text-emerald-400 font-bold">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-12 text-center text-slate-500">
                      <Users size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="font-semibold">ไม่พบรายชื่อพนักงาน</p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">
                        {emp.prefix}{emp.firstName} {emp.lastName}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{emp.department}</td>
                      <td className="px-4 py-3 text-slate-300">{emp.team}</td>
                      <td className="px-4 py-3 text-slate-300">{LOCATIONS[emp.locationId]?.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(emp)}
                            className="bg-blue-500/20 text-blue-400 p-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                            title="แก้ไข"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="bg-red-500/20 text-red-400 p-2 rounded-lg hover:bg-red-500/30 transition-colors"
                            title="ลบ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-slate-400 text-sm">
          แสดง {filteredEmployees.length} จาก {locationEmployees.length} คน ที่ {LOCATIONS[currentLocation].name}
        </div>
      </div>
    </div>
  );
}

// ============ REPORTS VIEW COMPONENT ============
function ReportsView({ attendances, employees, currentLocation }) {
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear() + 543);

  const locationConfig = LOCATIONS[currentLocation];
  const locationEmployees = employees.filter(e => e.locationId === currentLocation);
  const locationAttendances = attendances.filter(a => a.locationId === currentLocation);

  // Group by department and team
  const groupedData = locationEmployees.reduce((acc, emp) => {
    const key = `${emp.department}|${emp.team}`;
    if (!acc[key]) {
      acc[key] = {
        department: emp.department,
        team: emp.team,
        employees: []
      };
    }
    
    const empAttendances = locationAttendances.filter(a => a.employeeId === emp.id);
    const attendanceRate = empAttendances.length > 0 ? (empAttendances.length / 52 * 100).toFixed(1) : '0.0';
    
    acc[key].employees.push({
      ...emp,
      attendances: empAttendances,
      attendanceRate: attendanceRate
    });
    
    return acc;
  }, {});

  const exportToCSV = () => {
    const headers = ['แผนก', 'ชุดงาน', 'ชื่อ-นามสกุล', 'จำนวนครั้งเข้าร่วม', '%การเข้าร่วม'];
    const rows = Object.values(groupedData).flatMap(group =>
      group.employees.map(emp => [
        group.department,
        group.team,
        `${emp.prefix}${emp.firstName} ${emp.lastName}`,
        emp.attendances.length,
        emp.attendanceRate
      ])
    );

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `safety-talk-report-${currentLocation}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-800/50 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center">
              <BarChart3 size={28} className="text-emerald-400 mr-3" />
              รายงานการเข้าร่วมกิจกรรม Safety Talk
            </h2>
            <p className="text-slate-400 mt-1">{locationConfig.fullName}</p>
          </div>
          <button
            onClick={exportToCSV}
            className="bg-emerald-500 text-slate-900 font-bold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center"
          >
            <Download size={20} className="mr-2" />
            Export CSV
          </button>
        </div>
        
        {/* Storage Info */}
        <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-400 text-sm flex items-start">
            <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
            <span>
              <strong>การจัดการรูปภาพ:</strong> รูปถ่ายจะถูกลบอัตโนมัติหลังผ่าน 3 เดือน เพื่อประหยัดพื้นที่
            </span>
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <Users size={32} className="text-slate-900" />
          </div>
          <div className="text-4xl font-black text-slate-900">{locationEmployees.length}</div>
          <div className="text-slate-800 font-semibold text-sm mt-1">พนักงานทั้งหมด</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <div className="text-4xl font-black text-white">{locationAttendances.length}</div>
          <div className="text-slate-400 font-semibold text-sm mt-1">ครั้งที่เข้าร่วม</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={32} className="text-emerald-400" />
          </div>
          <div className="text-4xl font-black text-white">
            {locationEmployees.length > 0 ? ((locationAttendances.length / (locationEmployees.length * 52)) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-slate-400 font-semibold text-sm mt-1">% เฉลี่ยรวม</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <Calendar size={32} className="text-emerald-400" />
          </div>
          <div className="text-4xl font-black text-white">52</div>
          <div className="text-slate-400 font-semibold text-sm mt-1">สัปดาห์/ปี</div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-slate-800/50 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-black text-white mb-4">รายงานแยกตามแผนก/ชุดงาน</h3>
        
        <div className="bg-slate-900/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-emerald-400 font-bold">แผนก</th>
                  <th className="px-4 py-3 text-left text-emerald-400 font-bold">ชุดงาน</th>
                  <th className="px-4 py-3 text-left text-emerald-400 font-bold">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3 text-center text-emerald-400 font-bold">จำนวนครั้ง</th>
                  <th className="px-4 py-3 text-center text-emerald-400 font-bold">%การเข้าร่วม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {Object.values(groupedData).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-12 text-center text-slate-500">
                      <FileText size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="font-semibold">ไม่มีข้อมูล</p>
                    </td>
                  </tr>
                ) : (
                  Object.values(groupedData).flatMap((group, groupIdx) => 
                    group.employees.map((emp, empIdx) => (
                      <tr key={emp.id} className="hover:bg-slate-800/50 transition-colors">
                        {empIdx === 0 && (
                          <>
                            <td rowSpan={group.employees.length} className="px-4 py-3 text-white font-bold bg-slate-800/30">
                              {group.department}
                            </td>
                            <td rowSpan={group.employees.length} className="px-4 py-3 text-slate-300 bg-slate-800/30">
                              {group.team}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3 text-white">
                          {emp.prefix}{emp.firstName} {emp.lastName}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-300">
                          {emp.attendances.length}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${
                            parseFloat(emp.attendanceRate) >= 80 ? 'text-emerald-400' :
                            parseFloat(emp.attendanceRate) >= 50 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {emp.attendanceRate}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ SETTINGS VIEW COMPONENT ============
function SettingsView({ currentLocation, setCurrentLocation }) {
  const [selectedLocation, setSelectedLocation] = useState(currentLocation);
  const [locations, setLocations] = useState(LOCATIONS);
  const [saved, setSaved] = useState(false);

  const currentConfig = locations[selectedLocation];

  const updateLocationCoordinates = async (lat, lng) => {
    const newLocations = {
      ...locations,
      [selectedLocation]: {
        ...locations[selectedLocation],
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      }
    };
    setLocations(newLocations);
    
    // Save to Firebase
    try {
      await db.collection('settings').doc('locations').set(newLocations);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateLocationCoordinates(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          alert('ไม่สามารถรับตำแหน่งปัจจุบันได้');
        }
      );
    }
  };

  const saveSettings = async () => {
    Object.assign(LOCATIONS, locations);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const applyLocation = () => {
    setCurrentLocation(selectedLocation);
    alert(`เปลี่ยนสถานที่เป็น ${locations[selectedLocation].name} แล้ว`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800/50 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-black text-white mb-6 flex items-center">
          <Settings size={28} className="text-emerald-400 mr-3" />
          ตั้งค่าระบบ - แอดมิน
        </h2>

        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-6 mb-6">
          <h3 className="text-white font-bold mb-4 flex items-center">
            <MapPin size={20} className="text-emerald-400 mr-2" />
            เลือกหน่วยงานที่ต้องการตั้งค่า
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.values(locations).map((loc) => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc.id)}
                className={`px-4 py-3 rounded-lg font-bold text-sm transition-all ${
                  selectedLocation === loc.id
                    ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/50'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>

          <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
            <p className="text-emerald-400 font-bold text-lg">{currentConfig.name}</p>
            <p className="text-slate-400 text-sm">{currentConfig.fullName}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/50 rounded-lg p-6">
            <h3 className="text-white font-bold mb-4 flex items-center">
              <MapPin size={20} className="text-emerald-400 mr-2" />
              พิกัดจุดกิจกรรม - {currentConfig.name}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-2 text-sm">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={currentConfig.lat}
                    onChange={(e) => updateLocationCoordinates(e.target.value, currentConfig.lng)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-2 text-sm">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={currentConfig.lng}
                    onChange={(e) => updateLocationCoordinates(currentConfig.lat, e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <button
                onClick={getCurrentLocation}
                className="w-full bg-slate-700 text-white font-bold py-2 rounded-lg hover:bg-slate-600 transition-colors text-sm"
              >
                <MapPin size={16} className="inline mr-2" />
                ใช้ตำแหน่ง GPS ปัจจุบัน
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-6">
            <h3 className="text-white font-bold mb-4 flex items-center">
              <QrCode size={20} className="text-amber-400 mr-2" />
              สร้าง QR Code สำหรับแต่ละหน่วยงาน
            </h3>
            
            <p className="text-slate-300 text-sm mb-4">
              URL สำหรับสร้าง QR Code:
            </p>

            <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
              <p className="text-emerald-400 font-mono text-sm break-all">
                {window.location.origin}{window.location.pathname}?location={selectedLocation}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={applyLocation}
                className="bg-amber-500 text-slate-900 font-bold py-3 rounded-lg hover:bg-amber-400 transition-colors"
              >
                ใช้งานสถานที่นี้
              </button>
              <button
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}?location=${selectedLocation}`;
                  navigator.clipboard.writeText(url);
                  alert('คัดลอก URL แล้ว!');
                }}
                className="bg-slate-700 text-white font-bold py-3 rounded-lg hover:bg-slate-600 transition-colors"
              >
                คัดลอก URL
              </button>
            </div>
          </div>

          <button
            onClick={saveSettings}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-900 font-black py-4 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all text-lg"
          >
            {saved ? (
              <>
                <CheckCircle size={20} className="inline mr-2" />
                บันทึกสำเร็จ!
              </>
            ) : (
              'บันทึกการตั้งค่า'
            )}
          </button>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-400 text-sm flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>
                <strong>วิธีใช้งาน:</strong><br/>
                1. เลือกหน่วยงานที่ต้องการตั้งค่า<br/>
                2. ปรับพิกัด GPS (หรือใช้ตำแหน่งปัจจุบัน)<br/>
                3. คัดลอก URL และสร้าง QR Code ด้วยเครื่องมือ QR Code Generator<br/>
                4. แต่ละ QR Code จะพาไปยัง URL ที่แตกต่างกัน (ตาม location parameter)
              </span>
            </p>
          </div>

          {/* Storage Management */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-6">
            <h3 className="text-white font-bold mb-4 flex items-center">
              <AlertCircle size={20} className="text-purple-400 mr-2" />
              การจัดการพื้นที่เก็บข้อมูล
            </h3>
            
            <div className="space-y-3">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-emerald-400 font-bold mb-2">✅ ระบบอัตโนมัติ</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• รูปถ่ายจะถูก <strong className="text-white">Compress ให้เล็กที่สุด</strong> (~100-150 KB/รูป)</li>
                  <li>• ลบรูปอัตโนมัติหลังผ่าน <strong className="text-white">3 เดือน</strong></li>
                  <li>• เก็บเฉพาะข้อมูลการลงทะเบียนไว้ (ไม่ลบ)</li>
                  <li>• ประหยัดพื้นที่ <strong className="text-emerald-400">90%</strong></li>
                </ul>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-yellow-400 font-bold mb-2">📊 ประมาณการ</h4>
                <div className="text-slate-300 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>ขนาดรูป (หลัง compress):</span>
                    <span className="text-white font-bold">100-150 KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>30 คน x 52 สัปดาห์:</span>
                    <span className="text-white font-bold">~234 MB/ปี</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Firebase Free Plan:</span>
                    <span className="text-emerald-400 font-bold">1 GB (พอ 4 ปี!)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-blue-400 font-bold mb-2">🔄 การทำงาน</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• ตรวจสอบและลบรูปเก่าทุกครั้งที่เปิดแอพ</li>
                  <li>• ไม่ต้องตั้งค่าอะไรเพิ่ม</li>
                  <li>• ทำงานอัตโนมัติ 100%</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
