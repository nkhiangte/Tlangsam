import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_API_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const CHURCH_LOCATION = { lat: 23.4616, lng: 93.3609 };

const Contact = () => {
  if (!hasValidKey) {
    return (
      <div className="min-h-screen bg-stone-50">
        {/* Page Header */}
        <div className="bg-stone-900 pt-40 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px w-8 bg-church-gold"></div>
              <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Biak Pawhna</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">Contact Us</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex items-center justify-center">
          <div className="text-center max-w-lg bg-white p-12 rounded-[2.5rem] shadow-xl border border-stone-100">
            <h2 className="text-2xl font-serif mb-4">Google Maps API Key Required</h2>
            <p className="text-stone-600 mb-6 text-sm">To see the church location on the map, please add your Google Maps Platform API key.</p>
            <div className="text-left space-y-4 text-sm text-stone-600">
              <p><strong>Step 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener" className="text-church-burgundy underline">Get an API Key</a></p>
              <p><strong>Step 2:</strong> Add your key as a secret in AI Studio:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Open <strong>Settings</strong> (⚙️ gear icon, <strong>top-right corner</strong>)</li>
                <li>Select <strong>Secrets</strong></li>
                <li>Type <code>GOOGLE_MAPS_PLATFORM_KEY</code> as the secret name</li>
                <li>Paste your API key as the value</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Page Header */}
      <div className="bg-stone-900 pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-8 bg-church-gold"></div>
            <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Biak Pawhna</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">Contact Us</h1>
        </div>
      </div>

      <div className="bg-stone-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 mb-24">
            <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-stone-100">
              <h2 className="text-4xl md:text-5xl font-serif mb-8 text-stone-900">Biak Pawhna</h2>
              <p className="text-stone-500 mb-12 text-lg">Tawngtaipui i ngaihna emaw, zawhna i neih chuan min lo be pawh rawh.</p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-church-burgundy">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl mb-1 text-stone-900">Kan awmna</h4>
                    <p className="text-stone-500">Tlangsam, Champhai, Mizoram, 796321, India</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-church-burgundy">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl mb-1 text-stone-900">Phone</h4>
                    <p className="text-stone-500">+91 123 456 7890</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-church-burgundy">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl mb-1 text-stone-900">Email</h4>
                    <p className="text-stone-500">info@tlangsampresbyterian.org</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-stone-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-stone-800">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-white/80 mb-2">Hming Hmasa</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-lg text-white placeholder:text-white/40" />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-white/80 mb-2">Hming Hnuhnung</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-lg text-white placeholder:text-white/40" />
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-white/80 mb-2">Email</label>
                  <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-lg text-white placeholder:text-white/40" />
                </div>
                <div>
                  <label className="block text-base font-medium text-white/80 mb-2">Thuchah</label>
                  <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-lg text-white placeholder:text-white/40"></textarea>
                </div>
                <button className="w-full bg-church-gold text-stone-900 font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all">
                  Thawn rawh
                </button>
              </form>
            </div>
          </div>

          {/* Google Map Section */}
          <div className="bg-white p-4 rounded-[2.5rem] shadow-xl border border-stone-100 overflow-hidden h-[500px] relative">
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                defaultCenter={CHURCH_LOCATION}
                defaultZoom={17}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%', borderRadius: '1.5rem' }}
                gestureHandling={'greedy'}
                disableDefaultUI={false}
              >
                <AdvancedMarker position={CHURCH_LOCATION} title="Tlangsam Presbyterian Kohhran">
                  <Pin background="#800020" glyphColor="#c5a059" borderColor="#c5a059" />
                </AdvancedMarker>
              </Map>
            </APIProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
