import React, { useState, useRef } from 'react';
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
  ChevronRight,
  FileUp,
  FileDown,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, Timestamp, writeBatch, doc } from 'firebase/firestore';

const Records = () => {
  const [activeTab, setActiveTab] = useState('Baptisma');
  const [isImporting, setIsImporting] = useState(false);
  const { isAdmin, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { name: 'Baptisma', icon: <Droplets className="h-5 w-5" />, collection: 'baptism_records' },
    { name: 'Inneihna', icon: <Heart className="h-5 w-5" />, collection: 'wedding_records' },
    { name: 'Mitthi', icon: <FileText className="h-5 w-5" />, collection: 'funeral_records' },
    { name: 'Inkhawmpui', icon: <Mic className="h-5 w-5" />, collection: 'conference_records' },
    { name: 'Pem Dawnsawn', icon: <ArrowRightLeft className="h-5 w-5" />, collection: 'pem_dawnsawn_records' },
    { name: 'Pawl Dang', icon: <UserPlus className="h-5 w-5" />, collection: 'pawl_dang_records' },
  ];

  const recordContent: Record<string, any> = {
    'Baptisma': {
      title: 'Baptisma Record-te',
      description: 'Tlangsam Presbyterian Kohhran-a baptisma chang tawh zawng zawngte record.',
      stats: 'Baptisma chang tawh 1,200 chuang an awm tawh a ni.',
      recent: ['Lalthlamuana (2024)', 'Zosangzuali (2024)', 'Lalrinawma (2023)'],
      link: '/records/baptism',
      schema: { name: 'Hming', date: 'Baptisma Ni', parents: 'Nu leh Pa', officiant: 'Baptisma petu', location: 'Hmun' }
    },
    'Inneihna': {
      title: 'Inneihna Record-te',
      description: 'Kan kohhran-a innei tawh zawng zawngte record.',
      stats: 'Inneihna 450 chuang buatsaih a ni tawh a ni.',
      recent: ['Rohlua & Pari (2024)', 'Sanga & Mawii (2023)', 'Tluanga & Tei (2023)'],
      link: '/records/wedding',
      schema: { groom: 'Mipa Hming', bride: 'Hmeichhe Hming', date: 'Inneih Ni', officiant: 'Inneitirtu', witnesses: 'Hrechiangtute' }
    },
    'Mitthi': {
      title: 'Mitthi Record-te',
      description: 'Lalpa hnena chawl tawh kan kohhran member-te record.',
      stats: 'Lalpa hnena chawl tawh kan unaute hriatrengna.',
      recent: ['Pi Liani (2024)', 'Pu Thanga (2024)', 'Pi Pari (2023)'],
      link: '/records/funeral',
      schema: { name: 'Hming', date: 'Chawlh Ni', age: 'Kum', location: 'Hmun' }
    },
    'Inkhawmpui': {
      title: 'Inkhawmpui Record-te',
      description: 'Kohhran inkhawmpui hrang hrang minutes leh report-te.',
      stats: 'Kum tina inkhawmpui thurelte.',
      recent: ['KTP General Conference (2024)', 'Presbytery Meeting (2023)', 'Kohhran Inkhawmpui (2023)'],
      link: '/records/conference',
      schema: { title: 'Inkhawmpui Hming', date: 'A Hun', location: 'Hmun', delegates: 'Palai Zat' }
    },
    'Pem Dawnsawn': {
      title: 'Pem Dawnsawn',
      description: 'Hmun dang atanga kan kohhran-a pem lut tharte record.',
      stats: 'Member thar kan lo lawmte.',
      recent: ['Lalduhawmi from Aizawl', 'Zothana from Lunglei', 'Rina from Champhai'],
      link: '/records/pem-dawnsawn',
      schema: { name: 'Hming', from: 'Khawi atangin', date: 'Luh Ni', address: 'Veng' }
    },
    'Pawl Dang': {
      title: 'Pawl Dang atanga lo lut',
      description: 'Pawl dang atanga kan kohhran-a lo lut tharte record.',
      stats: 'Rinna kawng danga kan unau lo zawm ve tute.',
      recent: ['Lalremruata (2024)', 'Zuali (2024)', 'Mawia (2023)'],
      link: '/records/pawl-dang',
      schema: { name: 'Hming', from: 'Pawl Hming', date: 'Luh Ni', reason: 'Chhan' }
    }
  };

  const current = recordContent[activeTab];
  const currentCollection = tabs.find(t => t.name === activeTab)?.collection || '';

  const downloadTemplate = () => {
    const headers = Object.values(current.schema);
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${activeTab}_Template.xlsx`);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        if (jsonData.length === 0) {
          alert('Excel file-ah hian data a awm lo.');
          return;
        }

        const batch = writeBatch(db);
        const reverseSchema: { [key: string]: string } = {};
        Object.entries(current.schema).forEach(([key, label]) => {
          reverseSchema[String(label)] = key;
        });

        (jsonData as any[]).forEach((row: any) => {
          const record: any = {
            createdAt: Timestamp.now(),
            authorUid: user?.uid
          };

          Object.entries(row).forEach(([header, value]) => {
            const fieldKey = reverseSchema[String(header)];
            if (fieldKey) {
              record[fieldKey] = value;
            }
          });

          const newDocRef = doc(collection(db, currentCollection));
          batch.set(newDocRef, record);
        });

        await batch.commit();
        alert(`${jsonData.length} records hlawhtling takin import a ni ta!`);
      } catch (error) {
        console.error('Excel import error:', error);
        alert('Excel import-naah hian harsatna a awm: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Page Header */}
      <div className="bg-stone-900 pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-8 bg-church-gold"></div>
            <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Kohhran Record-te</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">Church Records</h1>
        </div>
      </div>

      <div className="py-24 bg-stone-50">
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
                      <div className="flex flex-wrap gap-4 mt-8">
                        <Link 
                          to={current.link}
                          className="inline-flex items-center gap-2 bg-church-burgundy text-white px-8 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all shadow-lg"
                        >
                          Record-te En rawh <ExternalLink className="h-4 w-4" />
                        </Link>
                        
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isImporting}
                              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all shadow-lg disabled:opacity-50"
                            >
                              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                              Excel Import
                            </button>
                            <button 
                              onClick={downloadTemplate}
                              className="inline-flex items-center gap-2 bg-stone-800 text-white px-8 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all shadow-lg"
                            >
                              <FileDown className="h-4 w-4" /> Template
                            </button>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleExcelImport} 
                              accept=".xlsx, .xls" 
                              className="hidden" 
                            />
                          </>
                        )}
                      </div>
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
      </div>
    </div>
  );
};

export default Records;
