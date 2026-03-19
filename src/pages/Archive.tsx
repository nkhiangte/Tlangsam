import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ScrollText, History, ChevronRight } from 'lucide-react';
import { LogoPlaceholder } from '../components/LogoPlaceholder';

const Archive = () => {
  const archives = [
    {
      title: "Minutes",
      description: "Kohhran committee thureltute vawn thatna.",
      icon: <ScrollText className="h-6 w-6" />,
      link: "/archive/minutes"
    },
    {
      title: "Upa kal ta te",
      description: "Kan kohhran upa hmasa, Lalpa hnena chawl tawhte hriatrengna.",
      icon: <History className="h-6 w-6" />,
      link: "/archive/upa-kal-ta-te"
    },
    {
      title: "Thlalak",
      description: "Kohhran thil thleng hrang hrang thlalakte.",
      icon: <LogoPlaceholder className="w-10 h-10" iconClassName="h-6 w-6 text-church-burgundy" />,
      link: "/archive/gallery"
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Page Header */}
      <div className="bg-stone-900 pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-8 bg-church-gold"></div>
            <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Kohhran Archive</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">Church Archives</h1>
        </div>
      </div>

      <div className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif mb-4">Kohhran Archive</h2>
            <p className="text-stone-500 max-w-2xl mx-auto">Kan kohhran kal tawh hnu leh thil thlengte vawn thatna.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {archives.map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="group p-8 rounded-3xl border border-stone-100 bg-stone-50 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 bg-church-burgundy/10 rounded-2xl flex items-center justify-center text-church-burgundy mb-6 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-serif mb-4">{item.title}</h3>
                <p className="text-stone-600 leading-relaxed mb-8">{item.description}</p>
                <Link 
                  to={item.link}
                  className="mt-auto inline-flex items-center gap-2 text-church-burgundy font-medium hover:gap-3 transition-all"
                >
                  Archive En rawh <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Archive;
