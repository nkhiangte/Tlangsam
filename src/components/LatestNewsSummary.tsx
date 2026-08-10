import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

const LatestNewsSummary = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const q = query(collection(db, 'news'), orderBy('date', 'desc'), limit(3));
        const snapshot = await getDocs(q);
        const fetchedNews = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as NewsItem[];
        setNews(fetchedNews);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'news');
      } finally {
        setLoading(false);
      }
    };
    fetchLatestNews();
  }, []);

  return (
    <section className="py-12 bg-stone-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-church-burgundy flex items-center gap-3">
            <Newspaper className="h-6 w-6 md:h-8 md:w-8" />
            Latest News
          </h2>
          <Link to="/news" className="text-sm font-semibold text-stone-600 hover:text-church-burgundy transition-colors flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-church-burgundy animate-spin" />
          </div>
        ) : news.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {news.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 flex flex-col transition-all hover:shadow-md">
                <div className="flex items-center gap-2 text-stone-400 text-xs font-semibold mb-3">
                  <Calendar className="h-4 w-4" />
                  {new Date(item.date).toLocaleDateString()}
                </div>
                <h3 className="font-bold text-stone-900 mb-2 line-clamp-2">{item.title}</h3>
                <p className="text-stone-600 text-sm line-clamp-3 mb-4 flex-grow">{item.content}</p>
                <Link to="/news" className="text-church-burgundy text-xs font-bold uppercase tracking-wider flex items-center gap-1 mt-auto group">
                  Chhiar zawm rawh <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-100 p-8 text-center text-stone-500">
            News thar a awm rih lo.
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestNewsSummary;
