import React from 'react';
import { motion } from 'motion/react';
import { Users, Calendar, FileText, Shield } from 'lucide-react';

interface CommitteePageProps {
  name: string;
  description: string;
}

const CommitteePage: React.FC<CommitteePageProps> = ({ name, description }) => {
  return (
    <div className="pt-24 min-h-screen">
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="text-church-gold font-medium uppercase tracking-widest text-sm mb-4 block">Committee</span>
            <h2 className="text-4xl md:text-5xl font-serif mb-4">{name}</h2>
            <p className="text-stone-500 max-w-2xl mx-auto">{description}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100">
              <div className="w-12 h-12 bg-church-burgundy/10 rounded-2xl flex items-center justify-center text-church-burgundy mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif mb-2">Member-te</h3>
              <p className="text-stone-600 text-sm">Committee member-te leh an mawhphurhna hrang hrangte.</p>
            </div>
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100">
              <div className="w-12 h-12 bg-church-burgundy/10 rounded-2xl flex items-center justify-center text-church-burgundy mb-6">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif mb-2">Inkhawm Hun</h3>
              <p className="text-stone-600 text-sm">Committee thutkhawm hun leh hmun hrang hrangte.</p>
            </div>
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100">
              <div className="w-12 h-12 bg-church-burgundy/10 rounded-2xl flex items-center justify-center text-church-burgundy mb-6">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif mb-2">Minutes & Report</h3>
              <p className="text-stone-600 text-sm">Committee thurel leh report pawimawh vawn thatnate.</p>
            </div>
          </div>

          <div className="bg-church-cream rounded-[2rem] p-8 md:p-12 border border-church-gold/20">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="h-6 w-6 text-church-burgundy" />
              <h3 className="text-2xl font-serif text-stone-900">Rawngbawlna Thupui</h3>
            </div>
            <p className="text-stone-700 leading-relaxed text-lg italic">
              "In thawk rimna hi Lalpaah chuan thlawn a ni lo tih in hriat avangin, rinnaah chuan nghet ula, sateh ula, Lalpa hnaah chuan bang lova thawk reng rawh u."
              <br />
              <span className="text-sm font-bold not-italic mt-4 block">— 1 Korinth 15:58</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CommitteePage;
