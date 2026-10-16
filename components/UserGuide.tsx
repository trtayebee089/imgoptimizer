
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, MousePointer2, Zap, BrainCircuit, 
  Layers, ChevronRight, Check, Image as ImageIcon, 
  FileJson, Scan, Sparkles, ArrowDown, Scale, 
  AlertTriangle, Play, Repeat, ThumbsUp
} from 'lucide-react';

// Simplified TOC Data
const SECTIONS = [
  { id: 'start-here', label: 'Start Here', icon: MousePointer2 },
  { id: 'how-it-works', label: 'The Magic Loop', icon: Zap },
  { id: 'robot-brain', label: 'Robot Brain (AI)', icon: BrainCircuit },
  { id: 'journey', label: 'The Journey', icon: Layers },
  { id: 'safety', label: 'Important Note', icon: AlertTriangle },
];

const VisualCard: React.FC<{ 
  title: string; 
  description: string; 
  icon: any; 
  children?: React.ReactNode;
  id: string;
  color?: string;
}> = ({ title, description, icon: Icon, children, id, color = "blue" }) => (
  <section id={id} className="scroll-mt-32 group">
    <div className="dark:bg-[#18181b] bg-white border dark:border-white/10 border-slate-200/60 rounded-[40px] overflow-hidden hover:border-blue-500/30 transition-all duration-500 shadow-sm">
      <div className="p-8 md:p-10 border-b dark:border-white/5 border-slate-100">
        <div className="flex items-center gap-5 mb-5">
          <div className={`w-14 h-14 rounded-2xl bg-${color}-500/10 dark:bg-${color}-500/20 text-${color}-600 dark:text-${color}-400 flex items-center justify-center shadow-inner`}>
            <Icon size={28} />
          </div>
          <h3 className="text-2xl md:text-3xl font-display font-black dark:text-white text-slate-900 tracking-tight">{title}</h3>
        </div>
        <p className="text-base md:text-lg dark:text-zinc-400 text-slate-600 leading-relaxed font-medium max-w-4xl">
          {description}
        </p>
      </div>
      
      {children && (
        <div className="p-8 md:p-10 bg-slate-50/50 dark:bg-black/20">
          {children}
        </div>
      )}
    </div>
  </section>
);

export const UserGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState('start-here');

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { rootMargin: '-20% 0px -50% 0px' });

    SECTIONS.forEach(section => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 120; 
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActiveSection(id);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Page Header */}
      <div className="py-10 md:py-16 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 border-b dark:border-white/10 border-slate-200/60 mb-10 md:mb-16">
         <div className="w-20 h-20 md:w-24 md:h-24 dark:bg-blue-600 bg-blue-500 text-white rounded-[32px] flex items-center justify-center shadow-xl shadow-blue-500/20 shrink-0 transform rotate-3 hover:rotate-6 transition-transform">
           <BookOpen size={40} className="md:w-12 md:h-12" />
         </div>
         <div className="max-w-2xl">
           <h1 className="text-4xl md:text-6xl font-black dark:text-white text-slate-900 tracking-tight leading-[0.9] mb-4">
             How to use <br/><span className="text-blue-500">Optimizer.pro</span>
           </h1>
           <p className="text-base md:text-lg font-medium text-slate-500 dark:text-zinc-400">
             Welcome to the ultimate guide! Learn how to shrink your images without making them look blurry. It's like magic, but with code.
           </p>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 lg:gap-20">
        
        {/* Sidebar TOC - Sticky on Desktop */}
        <aside className="w-full lg:w-72 shrink-0 hidden lg:block">
          <div className="lg:sticky lg:top-32 space-y-3 bg-white/50 dark:bg-white/5 backdrop-blur-xl p-6 rounded-[32px] border dark:border-white/10 border-slate-200/60">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Table of Contents</h4>
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollTo(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeSection === section.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}
              >
                <section.icon size={18} />
                {section.label}
                {activeSection === section.id && <ChevronRight size={16} className="ml-auto" />}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-16 min-w-0">
          
          <VisualCard 
            id="start-here" 
            title="Start Here" 
            icon={MousePointer2}
            description="Getting your pictures into the app is super easy. There are three ways to do it, so pick your favorite!"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white dark:bg-[#202023] border dark:border-white/5 border-slate-200 p-8 rounded-[32px] flex flex-col items-center justify-center text-center gap-4 hover:border-blue-500/50 hover:shadow-xl transition-all group/item aspect-square">
                  <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/item:scale-110 transition-transform">
                    <Layers size={32} />
                  </div>
                  <div>
                    <h5 className="text-lg font-black dark:text-white text-slate-900 mb-1">Drag & Drop</h5>
                    <p className="text-sm text-slate-500 font-medium">Grab files and drop them anywhere.</p>
                  </div>
               </div>

               <div className="bg-white dark:bg-[#202023] border dark:border-white/5 border-slate-200 p-8 rounded-[32px] flex flex-col items-center justify-center text-center gap-4 hover:border-purple-500/50 hover:shadow-xl transition-all group/item aspect-square">
                  <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover/item:scale-110 transition-transform">
                    <FileJson size={32} />
                  </div>
                  <div>
                    <h5 className="text-lg font-black dark:text-white text-slate-900 mb-1">Paste It</h5>
                    <p className="text-sm text-slate-500 font-medium">Just hit <code className="bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs">Cmd+V</code> to paste from clipboard.</p>
                  </div>
               </div>

               <div className="bg-white dark:bg-[#202023] border dark:border-white/5 border-slate-200 p-8 rounded-[32px] flex flex-col items-center justify-center text-center gap-4 hover:border-emerald-500/50 hover:shadow-xl transition-all group/item aspect-square">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover/item:scale-110 transition-transform">
                    <ImageIcon size={32} />
                  </div>
                  <div>
                    <h5 className="text-lg font-black dark:text-white text-slate-900 mb-1">Click to Browse</h5>
                    <p className="text-sm text-slate-500 font-medium">Open your folders and select many files.</p>
                  </div>
               </div>
            </div>
          </VisualCard>

          <VisualCard 
            id="how-it-works" 
            title="The Magic Loop" 
            icon={Repeat}
            color="orange"
            description="How do we make files so small? We don't just squash them once. We check the size, squash a little, check again, and repeat until it's perfect. Think of it like packing a suitcase!"
          >
             <div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-slate-100 dark:bg-[#000000]/40 p-8 rounded-[40px] border dark:border-white/5 border-slate-200">
                
                {/* Step 1 */}
                <div className="flex flex-col items-center gap-4 text-center max-w-[140px]">
                    <div className="w-20 h-20 rounded-3xl bg-white dark:bg-[#18181b] flex items-center justify-center shadow-lg border-2 border-slate-200 dark:border-white/10">
                        <ImageIcon size={32} className="text-slate-400" />
                    </div>
                    <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Big Image</span>
                </div>

                <div className="hidden md:flex flex-col items-center">
                    <div className="w-16 h-1 bg-slate-300 dark:bg-white/10 rounded-full"></div>
                </div>
                <div className="md:hidden">
                    <ArrowDown size={24} className="text-slate-300" />
                </div>

                {/* The Loop */}
                <div className="relative p-6 bg-white dark:bg-[#18181b] rounded-[32px] border-2 border-orange-500/20 shadow-xl flex flex-col items-center gap-3 w-full md:w-auto">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">The Loop</div>
                    <div className="flex items-center gap-2 text-orange-500 mb-1">
                        <Scale size={20} />
                        <span className="font-bold text-sm">Is it too big?</span>
                    </div>
                    <div className="flex gap-2 w-full">
                        <div className="flex-1 bg-slate-50 dark:bg-black/20 p-3 rounded-xl text-center border border-slate-100 dark:border-white/5">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Yes</span>
                            <span className="text-xs font-black dark:text-white text-slate-800">Shrink 5%</span>
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-black/20 p-3 rounded-xl text-center border border-slate-100 dark:border-white/5">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Still Yes</span>
                            <span className="text-xs font-black dark:text-white text-slate-800">Resize</span>
                        </div>
                    </div>
                    <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-orange-500 w-2/3 animate-[pulse_2s_infinite]"></div>
                    </div>
                </div>

                <div className="hidden md:flex flex-col items-center">
                    <div className="w-16 h-1 bg-slate-300 dark:bg-white/10 rounded-full"></div>
                </div>
                <div className="md:hidden">
                    <ArrowDown size={24} className="text-slate-300" />
                </div>

                {/* Final */}
                <div className="flex flex-col items-center gap-4 text-center max-w-[140px]">
                    <div className="w-20 h-20 rounded-3xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                        <Check size={32} className="text-white" />
                    </div>
                    <span className="text-xs font-black uppercase text-green-500 tracking-widest">Perfect</span>
                </div>

             </div>
          </VisualCard>

          <VisualCard 
            id="robot-brain" 
            title="Robot Brain (AI)" 
            icon={BrainCircuit}
            color="purple"
            description="If you turn on AI Vision, a smart robot looks at your picture first. It decides if your picture is a real photo or a drawing, and treats them differently!"
          >
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Photo Strategy */}
                <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border border-indigo-500/20 p-8 rounded-[32px] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Scan size={100} />
                   </div>
                   <div className="relative z-10">
                      <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <ImageIcon size={24} />
                      </div>
                      <h4 className="text-xl font-black text-indigo-600 dark:text-indigo-300 mb-2">It sees a PHOTO</h4>
                      <p className="text-sm font-medium text-indigo-900/60 dark:text-indigo-200/60 leading-relaxed mb-4">
                        "This is a real world picture! It has lots of colors and noise. I can shrink this a lot and nobody will notice."
                      </p>
                      <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl backdrop-blur-sm inline-block">
                         <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Action: Max Compression</span>
                      </div>
                   </div>
                </div>

                {/* Graphic Strategy */}
                <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/5 border border-pink-500/20 p-8 rounded-[32px] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Scale size={100} />
                   </div>
                   <div className="relative z-10">
                      <div className="w-12 h-12 bg-pink-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <Sparkles size={24} />
                      </div>
                      <h4 className="text-xl font-black text-pink-600 dark:text-pink-300 mb-2">It sees a DRAWING</h4>
                      <p className="text-sm font-medium text-pink-900/60 dark:text-pink-200/60 leading-relaxed mb-4">
                        "This has sharp lines and text! If I shrink it too much, it will look fuzzy. I will be very gentle."
                      </p>
                      <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl backdrop-blur-sm inline-block">
                         <span className="text-xs font-bold text-pink-700 dark:text-pink-300">Action: Keep Sharp</span>
                      </div>
                   </div>
                </div>

             </div>
          </VisualCard>

          <VisualCard 
            id="journey" 
            title="The Journey" 
            icon={Layers}
            color="green"
            description="What actually happens when you press the button? Here is the step-by-step trip your image takes."
          >
             <div className="space-y-4">
                {[
                  { step: '01', title: 'Check-In', desc: 'We read the file. How big is it? How wide is it?' },
                  { step: '02', title: 'Big Chop', desc: 'If it is a HUGE 4K image, we cut it in half immediately to save time.' },
                  { step: '03', title: 'The Squeeze', desc: 'We lower the quality slightly. Does it fit in the box yet?' },
                  { step: '04', title: 'The Shrink', desc: 'If quality is too low, we make the image dimensions smaller.' },
                  { step: '05', title: 'Delivery', desc: 'Once it fits the target size, we wrap it up for you to download.' }
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-6 p-5 rounded-[24px] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-green-500/30 transition-all group">
                     <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center font-black text-lg text-slate-400 group-hover:bg-green-500 group-hover:text-white transition-colors shrink-0">
                       {s.step}
                     </div>
                     <div>
                        <h5 className="text-lg font-black dark:text-white text-slate-900 mb-1">{s.title}</h5>
                        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">{s.desc}</p>
                     </div>
                  </div>
                ))}
             </div>
          </VisualCard>

          <section id="safety" className="scroll-mt-32">
             <div className="p-8 md:p-12 rounded-[40px] bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 flex flex-col md:flex-row gap-8 items-start">
                <div className="w-16 h-16 bg-amber-400 text-amber-900 rounded-[24px] flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                   <AlertTriangle size={32} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-amber-800 dark:text-amber-500 uppercase tracking-tight mb-3">Important Warning</h3>
                   <p className="text-base md:text-lg font-medium text-amber-800/70 dark:text-amber-200/60 leading-relaxed mb-6">
                      Be careful with the <strong>"Quality Floor"</strong> setting! <br/>
                      If you set it too low (like under 50%), the app will try *really* hard to shrink your image, but it might start to look like a blurry mess or a retro video game.
                   </p>
                   <div className="flex items-center gap-3 text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider bg-amber-100 dark:bg-amber-500/10 px-4 py-2 rounded-xl inline-flex">
                      <ThumbsUp size={16} /> Keep it above 70% for best results!
                   </div>
                </div>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
};
