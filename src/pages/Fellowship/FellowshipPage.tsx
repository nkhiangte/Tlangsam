import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Music, Calendar, Zap, Loader2 } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { LogoPlaceholder } from '../../components/LogoPlaceholder';

interface FellowshipData {
  name: string;
  description: string;
  purpose: string;
  imageUrl: string;
  meetingTime: string;
  activities: string[];
  members?: string[];
  officeBearers?: string[];
}

interface FellowshipPageProps {
  id: string;
  defaultName: string;
  defaultDescription: string;
  defaultPurpose: string;
  defaultImageUrl: string;
  defaultMeetingTime: string;
  defaultActivities: string[];
}

const FellowshipPage: React.FC<FellowshipPageProps> = ({ 
  id, 
  defaultName, 
  defaultDescription,
  defaultPurpose,
  defaultImageUrl,
  defaultMeetingTime,
  defaultActivities
}) => {
  const [data, setData] = useState<FellowshipData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'fellowships', id), (doc) => {
      if (doc.exists()) {
        setData(doc.data() as FellowshipData);
      } else {
        setData({
          name: defaultName,
          description: defaultDescription,
          purpose: defaultPurpose,
          imageUrl: defaultImageUrl,
          meetingTime: defaultMeetingTime,
          activities: defaultActivities
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id, defaultName, defaultDescription, defaultPurpose, defaultImageUrl, defaultMeetingTime, defaultActivities]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="pt-24 pb-20 min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4">{data.name}</h1>
          <p className="text-xl text-stone-600 max-w-3xl mx-auto">
            {data.description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative rounded-2xl shadow-xl overflow-hidden aspect-[4/3] bg-stone-200 flex items-center justify-center">
              {data.imageUrl ? (
                <img 
                  src={data.imageUrl} 
                  alt={data.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <LogoPlaceholder className="w-40 h-40" iconClassName="w-20 h-20 text-stone-400" />
              )}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-serif text-stone-900">Kan Thiltum</h2>
            <p className="text-stone-600 leading-relaxed">
              {data.purpose}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl shadow-sm border border-stone-100 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-medium text-stone-900">Inkhawm Hun</h3>
                  <p className="text-sm text-stone-500">{data.meetingTime}</p>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-stone-100 flex items-start gap-3">
                <Users className="w-5 h-5 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-medium text-stone-900">Member-te</h3>
                  <p className="text-sm text-stone-500">
                    {data.members && data.members.length > 0 
                      ? data.members.join(', ') 
                      : "Kohhran member zawng zawngte."}
                  </p>
                </div>
              </div>
            </div>

            {data.officeBearers && data.officeBearers.length > 0 && (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 mb-4">Office Bearers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                  {data.officeBearers.map((ob, i) => (
                    <div key={i} className="text-stone-700 text-sm flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                      {ob}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data.activities && data.activities.map((activity, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100"
            >
              <Zap className="w-8 h-8 text-emerald-600 mb-4" />
              <h3 className="text-xl font-serif mb-2">Hmalakna {index + 1}</h3>
              <p className="text-stone-600">{activity}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FellowshipPage;
