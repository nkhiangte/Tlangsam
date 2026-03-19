import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Newspaper, Calendar, Clock, ChevronRight, Loader2, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../App';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  imageUrl?: string;
  source?: string;
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    author: 'Kohhran Office'
  });

  useEffect(() => {
    // Listen to dedicated news collection
    const q = query(collection(db, 'news'), orderBy('date', 'desc'));
    
    let newsUnsubscribe: () => void;
    let committeesUnsubscribe: () => void;
    let fellowshipsUnsubscribe: () => void;

    const aggregateAllNews = (
      manualNews: NewsItem[], 
      committeesData: any[], 
      fellowshipsData: any[]
    ) => {
      const aggregated: NewsItem[] = [...manualNews];

      // Add committee activities
      committeesData.forEach(committee => {
        if (committee.activities && Array.isArray(committee.activities)) {
          committee.activities.forEach((activity: any, index: number) => {
            if (typeof activity === 'object' && activity !== null) {
              aggregated.push({
                id: `committee-${committee.id}-${index}`,
                title: activity.title || "Activity",
                content: activity.content || "",
                date: activity.date || new Date().toISOString(),
                author: committee.name || "Committee",
                imageUrl: activity.imageUrl,
                source: 'committee'
              });
            }
          });
        }
      });

      // Add fellowship activities
      fellowshipsData.forEach(fellowship => {
        if (fellowship.activities && Array.isArray(fellowship.activities)) {
          fellowship.activities.forEach((activity: any, index: number) => {
            if (typeof activity === 'object' && activity !== null) {
              aggregated.push({
                id: `fellowship-${fellowship.id}-${index}`,
                title: activity.title || "Activity",
                content: activity.content || "",
                date: activity.date || new Date().toISOString(),
                author: fellowship.name || "Fellowship",
                imageUrl: activity.imageUrl,
                source: 'fellowship'
              });
            }
          });
        }
      });

      // Sort by date descending
      aggregated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNews(aggregated);
      setLoading(false);
    };

    let currentManualNews: NewsItem[] = [];
    let currentCommittees: any[] = [];
    let currentFellowships: any[] = [];

    newsUnsubscribe = onSnapshot(q, (snapshot) => {
      currentManualNews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NewsItem[];
      aggregateAllNews(currentManualNews, currentCommittees, currentFellowships);
    });

    committeesUnsubscribe = onSnapshot(collection(db, 'committees'), (snapshot) => {
      currentCommittees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      aggregateAllNews(currentManualNews, currentCommittees, currentFellowships);
    });

    fellowshipsUnsubscribe = onSnapshot(collection(db, 'fellowships'), (snapshot) => {
      currentFellowships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      aggregateAllNews(currentManualNews, currentCommittees, currentFellowships);
    });

    return () => {
      newsUnsubscribe();
      committeesUnsubscribe();
      fellowshipsUnsubscribe();
    };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'news'), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      setIsAdding(false);
      setFormData({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        author: 'Kohhran Office'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'news');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('I delete chiang maw?')) return;
    try {
      await deleteDoc(doc(db, 'news', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'news');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const item = news.find(n => n.id === id);
      if (!item) return;
      await updateDoc(doc(db, 'news', id), {
        title: item.title,
        content: item.content,
        date: item.date,
        author: item.author,
        updatedAt: new Date().toISOString()
      });
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'news');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px w-8 bg-church-gold"></div>
              <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Chanchin Thar</span>
            </div>
            <h1 className="text-4xl font-serif font-bold text-stone-900">Latest News</h1>
          </div>
          
          {isAdmin && !isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-church-burgundy text-white px-6 py-3 rounded-full font-medium hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus className="h-5 w-5" /> News thar siamna
            </button>
          )}
        </div>

        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100 mb-12"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif font-bold text-stone-800">News Thar Siamna</h2>
              <button onClick={() => setIsAdding(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Title</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all"
                    placeholder="News thupui..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Content</label>
                <textarea 
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all"
                  placeholder="A chanchin chipchiar..."
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-church-burgundy text-white py-4 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg"
              >
                Save News
              </button>
            </form>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-12 w-12 text-church-gold animate-spin" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-stone-200">
            <Newspaper className="h-16 w-16 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-400">News a la awm lo.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {news.map((item) => (
              <motion.div 
                key={item.id}
                layout
                className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-stone-100 hover:shadow-md transition-all group"
              >
                {editingId === item.id ? (
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      value={item.title}
                      onChange={(e) => {
                        const newNews = news.map(n => n.id === item.id ? {...n, title: e.target.value} : n);
                        setNews(newNews);
                      }}
                      className="w-full text-2xl font-serif font-bold border-b border-stone-200 focus:outline-none focus:border-church-gold py-2"
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                      <input 
                        type="date" 
                        value={item.date}
                        onChange={(e) => {
                          const newNews = news.map(n => n.id === item.id ? {...n, date: e.target.value} : n);
                          setNews(newNews);
                        }}
                        className="w-full text-sm border-b border-stone-200 focus:outline-none focus:border-church-gold py-2"
                      />
                      <input 
                        type="text" 
                        value={item.author}
                        onChange={(e) => {
                          const newNews = news.map(n => n.id === item.id ? {...n, author: e.target.value} : n);
                          setNews(newNews);
                        }}
                        className="w-full text-sm border-b border-stone-200 focus:outline-none focus:border-church-gold py-2"
                      />
                    </div>
                    <textarea 
                      value={item.content}
                      rows={4}
                      onChange={(e) => {
                        const newNews = news.map(n => n.id === item.id ? {...n, content: e.target.value} : n);
                        setNews(newNews);
                      }}
                      className="w-full text-stone-600 leading-relaxed border border-stone-200 rounded-xl p-4 focus:outline-none focus:border-church-gold"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUpdate(item.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" /> Save
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="bg-stone-100 text-stone-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                      >
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-church-gold">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.author}
                        </div>
                      </div>
                      {isAdmin && !item.source && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingId(item.id)}
                            className="p-2 text-stone-400 hover:text-church-burgundy hover:bg-stone-50 rounded-lg transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {item.imageUrl && (
                      <div className="mb-6 rounded-2xl overflow-hidden aspect-video bg-stone-100 border border-stone-100">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-4 group-hover:text-church-burgundy transition-colors">
                      {item.title}
                      {item.source && (
                        <span className="ml-3 inline-block px-2 py-0.5 bg-stone-100 text-stone-400 text-[10px] font-bold uppercase tracking-widest rounded align-middle">
                          {item.source}
                        </span>
                      )}
                    </h2>
                    <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
