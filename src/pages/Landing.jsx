import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, MapPin, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <video autoPlay muted loop playsInline className="fixed inset-0 w-full h-full object-cover" poster="">
        <source src="/ma%27ad%20mosque.mp4" type="video/mp4" />
      </video>
      <div className="gradient-secondary fixed inset-0 opacity-95" />
      <div className="fixed inset-0">
        <div className="absolute top-[-15%] left-[-5%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[140px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[40%] left-[30%] w-[25%] h-[25%] rounded-full bg-cyan-500/5 blur-[100px] animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-[30%] left-[10%] w-[20%] h-[20%] rounded-full bg-emerald-500/5 blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute top-4 left-3 sm:top-8 sm:left-8 flex items-center gap-3 z-10 animate-fade-in">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
          <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="hidden sm:block">
          <p className="text-white font-semibold text-sm">MA'AD AHLIL AATHAR</p>
          <p className="text-white/40 text-xs">Assessment System</p>
        </div>
      </div>

      <div className="absolute top-4 right-3 sm:top-8 sm:right-8 z-10 animate-fade-in flex items-center gap-3">
        <Button
          onClick={() => navigate('/login')}
          className="bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 h-11 text-xs sm:text-sm px-3 sm:px-4"
        >
          Sign In <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
        </Button>
      </div>

      <div className="relative z-10 w-full max-w-4xl animate-fade-in text-center pt-16 sm:pt-0">
        <div className="mb-3" style={{ animation: 'slideUp 0.6s ease-out' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs mb-6">
            <Sparkles className="w-3 h-3" /> Islamic Educational Institution
          </div>

          <p className="text-2xl sm:text-3xl text-white/80 mb-4" dir="rtl">
            بسم الله الرحمن الرحيم
          </p>

          <p className="text-xl sm:text-2xl font-black text-white/80 mb-3 sm:mb-4" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', 'Traditional Arabic', serif" }}>
            مَعْهَدُ أَهْلِ الْآثَارِ
          </p>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-1 sm:mb-2 tracking-tight">
            MA'AD AHLIL
          </h1>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-tight mb-4 sm:mb-6 tracking-tight
            text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300">
            AATHAR
          </h1>

          <p className="text-xl sm:text-2xl font-bold text-white/80 max-w-2xl mx-auto leading-relaxed px-2" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', 'Traditional Arabic', serif" }}>
            التمسُّكُ بالكتابِ والسُّنَّةِ بإخلاصٍ
          </p>
        </div>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-10 px-4" style={{ animation: 'slideUp 0.6s ease-out 0.2s both' }}>
            <div className="flex items-start gap-2 text-white/50 text-sm max-w-full">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span className="break-words">No 3, Mosadoluwa Street, behind Osogbo Local Govt., Oke Baale, Osogbo, Osun State</span>
            </div>
          </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3" style={{ animation: 'slideUp 0.6s ease-out 0.3s both' }}>
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Phone className="w-4 h-4 text-purple-400 shrink-0" />
            <span>08033719211</span>
          </div>
          <span className="text-white/20 hidden sm:inline">|</span>
          <span className="text-white/50 text-sm">08034660100</span>
          <span className="text-white/20 hidden sm:inline">|</span>
          <span className="text-white/50 text-sm">08062837011</span>
        </div>

        <div className="mt-10" style={{ animation: 'slideUp 0.6s ease-out 0.4s both' }}>
          <Button
            onClick={() => navigate('/login')}
            className="h-14 px-10 text-lg font-bold gradient-accent text-white border-0 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        <div className="mt-12" style={{ animation: 'slideUp 0.6s ease-out 0.5s both' }}>
          <p className="text-white/20 text-xs">
            &copy; {new Date().getFullYear()} MA'AD AHLIL AATHAR. All rights reserved.
          </p>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/10 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
