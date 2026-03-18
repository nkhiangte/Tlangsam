import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Image as ImageIcon, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Gallery = () => {
  const images = [
    { url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800', title: 'Sunday Service', category: 'Worship' },
    { url: 'https://images.unsplash.com/photo-1548625361-195fe57724e1?q=80&w=800', title: 'Youth Gathering', category: 'Youth' },
    { url: 'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?q=80&w=800', title: 'Church Choir', category: 'Music' },
    { url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=800', title: 'Community Outreach', category: 'Mission' },
    { url: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=800', title: 'Bible Study', category: 'Education' },
    { url: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=800', title: 'Christmas Celebration', category: 'Events' },
    { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800', title: 'Wedding Ceremony', category: 'Sacraments' },
    { url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800', title: 'Leadership Meeting', category: 'Admin' },
  ];

  return (
    <div className="min-h-screen pt-32 pb-24 bg-church-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-church-burgundy font-medium hover:gap-3 transition-all mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4">Church Gallery</h1>
              <p className="text-stone-600 max-w-2xl">Capturing the moments of faith, community, and worship at Tlangsam Presbyterian Church.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <div className="aspect-square overflow-hidden">
                <img 
                  src={img.url} 
                  alt={img.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                <span className="text-church-gold text-xs font-bold uppercase tracking-widest mb-1">{img.category}</span>
                <h3 className="text-white font-serif text-xl mb-3">{img.title}</h3>
                <button className="flex items-center gap-2 text-white/80 text-sm hover:text-white transition-colors">
                  <Maximize2 className="h-4 w-4" /> View Full Image
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
