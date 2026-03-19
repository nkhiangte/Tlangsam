import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

const Contact = () => {
  return (
    <div className="pt-32 min-h-screen">
      <section className="py-24 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif mb-8">Biak Pawhna</h2>
              <p className="text-white/60 mb-12 text-lg">Tawngtaipui i ngaihna emaw, zawhna i neih chuan min lo be pawh rawh.</p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-church-gold">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl mb-1">Kan awmna</h4>
                    <p className="text-white/60">Tlangsam Village, Mizoram, India</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-church-gold">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl mb-1">Phone</h4>
                    <p className="text-white/60">+91 123 456 7890</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-church-gold">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl mb-1">Email</h4>
                    <p className="text-white/60">info@tlangsampresbyterian.org</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-8 md:p-12 rounded-3xl backdrop-blur-sm border border-white/10">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-white/80 mb-2">Hming Hmasa</label>
                    <input type="text" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-lg text-white placeholder:text-white/40" />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-white/80 mb-2">Hming Hnuhnung</label>
                    <input type="text" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-lg text-white placeholder:text-white/40" />
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-white/80 mb-2">Email</label>
                  <input type="email" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-lg text-white placeholder:text-white/40" />
                </div>
                <div>
                  <label className="block text-base font-medium text-white/80 mb-2">Thuchah</label>
                  <textarea rows={4} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-lg text-white placeholder:text-white/40"></textarea>
                </div>
                <button className="w-full bg-church-gold text-stone-900 font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all">
                  Thawn rawh
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
