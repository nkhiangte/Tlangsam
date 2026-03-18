import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Droplets, 
  Heart, 
  FileText, 
  Mic, 
  ArrowRightLeft, 
  UserPlus, 
  Calendar, 
  ExternalLink, 
  ChevronRight 
} from 'lucide-react';

const Records = () => {
  const [activeTab, setActiveTab] = useState('Baptisma');

  const tabs = [
    { name: 'Baptisma', icon: <Droplets className="h-5 w-5" /> },
    { name: 'Inneihna', icon: <Heart className="h-5 w-5" /> },
    { name: 'Mitthi', icon: <FileText className="h-5 w-5" /> },
    { name: 'Inkhawmpui', icon: <Mic className="h-5 w-5" /> },
    { name: 'Pem Dawnsawn', icon: <ArrowRightLeft className="h-5 w-5" /> },
    { name: 'Pawl Dang', icon: <UserPlus className="h-5 w-5" /> },
  ];

  const recordContent: Record<string, any> = {
    'Baptisma': {
      title: 'Baptisma Record-te',
      description: 'Tlangsam Presbyterian Kohhran-a baptisma chang tawh zawng zawngte record.',
      stats: 'Baptisma chang tawh 1,200 chuang an awm tawh a ni.',
      recent: ['Lalthlamuana (2024)', 'Zosangzuali (2024)', 'Lalrinawma (2023)'],
      link: '/records/baptism'
    },
    'Inneihna': {
      title: 'Inneihna Record-te',
      description: 'Kan kohhran-a innei tawh zawng zawngte record.',
      stats: 'Inneihna 450 chuang buatsaih a ni tawh a ni.',
      recent: ['Rohlua & Pari (2024)', 'Sanga & Mawii (2023)', 'Tluanga & Tei (2023)'],
      link: '/records/wedding'
    },
    'Mitthi': {
      title: 'Mitthi Record-te',
      description: 'Lalpa hnena chawl tawh kan kohhran member-te record.',
      stats: 'Lalpa hnena chawl tawh kan unaute hriatrengna.',
      recent: ['Pi Liani (2024)', 'Pu Thanga (2024)', 'Pi Pari (2023)'],
      link: '/records/funeral'
    },
    'Inkhawmpui': {
      title: 'Inkhawmpui Record-te',
      description: 'Kohhran inkhawmpui hrang hrang minutes leh report-te.',
      stats: 'Kum tina inkhawmpui thurelte.',
      recent: ['KTP General Conference (2024)', 'Presbytery Meeting (2023)', 'Kohhran Inkhawmpui (2023)'],
      link: '/records/conference'
    },
    'Pem Dawnsawn': {
      title: 'Pem Dawnsawn',
      description: 'Hmun dang atanga kan kohhran-a pem lut tharte record.',
      stats: 'Member thar kan lo lawmte.',
      recent: ['Lalduhawmi from Aizawl', 'Zothana from Lunglei', 'Rina from Champhai'],
      link: '/records/pem-dawnsawn'
    },
    'Pawl Dang': {
      title: 'Pawl Dang atanga lo lut',
      description: 'Pawl dang atanga kan kohhran-a lo lut tharte record.',
      stats: 'Rinna kawng danga kan unau lo zawm ve tute.',
      recent: ['Lalremruata (2024)', 'Zuali (2024)', 'Mawia (2023)'],
      link: '/records/pawl-dang'
    }
  };

  const current = recordContent[activeTab];

  return (
    <div className="pt-24 min-h-screen">
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif mb-4">Kohhran Record-te</h2>
            <p className="text-stone-500 max-w-2xl mx-auto">Kan kohhran chanchin leh thil thleng pawimawhte vawn thatna.</p>
          </div>

          <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-stone-100">
            <div className="flex flex-wrap border-b border-stone-100 bg-stone-50/50">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative ${
                    activeTab === tab.name 
                      ? 'text-church-burgundy bg-white' 
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                  {activeTab === tab.name && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-church-burgundy"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="p-8 md:p-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="grid md:grid-cols-2 gap-12 items-start">
                    <div>
                      <h3 className="text-3xl font-serif mb-4 text-stone-900">{current.title}</h3>
                      <p className="text-stone-600 mb-8 leading-relaxed text-lg">
                        {current.description}
                      </p>
                      <div className="bg-church-cream p-6 rounded-2xl border border-church-gold/20">
                        <p className="text-church-burgundy font-medium italic">
                          {current.stats}
                        </p>
                      </div>
                      <Link 
                        to={current.link}
                        className="mt-8 inline-flex items-center gap-2 bg-church-burgundy text-white px-8 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all shadow-lg"
                      >
                        Record-te En rawh <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                    
                    <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100">
                      <h4 className="font-serif text-xl mb-6 text-stone-800 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-church-gold" />
                        Thil thleng thar-te
                      </h4>
                      <ul className="space-y-4">
                        {current.recent.map((entry: string, i: number) => (
                          <li key={i} className="flex items-center gap-3 text-stone-600 pb-3 border-b border-stone-200 last:border-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-church-gold"></div>
                            {entry}
                          </li>
                        ))}
                      </ul>
                      <Link to={current.link} className="mt-8 text-church-burgundy font-medium flex items-center gap-2 hover:gap-3 transition-all">
                        Registry En vek rawh <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Records;
