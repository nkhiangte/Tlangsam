import React from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon } from 'lucide-react';

const About = () => {
  return (
    <div className="pt-24 min-h-screen">
      <section className="py-24 bg-church-cream overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-stone-200 flex items-center justify-center">
                <ImageIcon className="w-20 h-20 text-stone-400" />
              </div>
              <div className="absolute -bottom-8 -right-8 bg-church-burgundy p-8 rounded-3xl text-white hidden md:block max-w-xs shadow-xl">
                <p className="font-serif text-2xl italic mb-2">"Khawiah pawh mi pahnih emaw pathum emaw ka hminga an inkhawmna apiangah chuan an zingah ka awm thin a ni."</p>
                <p className="text-sm opacity-80">— Matthaia 18:20</p>
              </div>
            </div>

            <div>
              <span className="text-church-gold font-medium uppercase tracking-widest text-sm mb-4 block">Kan Chanchin</span>
              <h2 className="text-4xl md:text-5xl font-serif mb-8 leading-tight">Tlangsam-a Rinna Hlu</h2>
              <div className="space-y-6 text-stone-600 leading-relaxed text-lg">
                <p>
                  Tlangsam Presbyterian Kohhran hi kan khawtlang tana rinna lungphum pawimawh tak a ni a. Pathian thu dik tak vawng nungin, khawvelah Isua Krista chanchin tha puang chhuaktu nih kan tum tlat a ni.
                </p>
                <p>
                  Kan thupui ber chu Isua Krista zirtir siam leh Pathian chawimawi a ni a. Tawngtai te, Pathian thu zir te, leh rawngbawlna hrang hrang hmangin kan thawk chhuak thin a ni.
                </p>
                <div className="grid grid-cols-2 gap-8 pt-6">
                  <div>
                    <h4 className="text-stone-900 font-serif text-xl mb-2">Kan Vision</h4>
                    <p className="text-sm">Tlangsam khua hi Pathian khawngaihna hmanga tih thar a nih nan.</p>
                  </div>
                  <div>
                    <h4 className="text-stone-900 font-serif text-xl mb-2">Kan Hlutna</h4>
                    <p className="text-sm">Pathian Thu, Tawngtai, Inpawlhona, Rawngbawlna, leh Khawngaihna.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
