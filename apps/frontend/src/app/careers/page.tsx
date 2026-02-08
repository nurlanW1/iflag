import { Flag, Briefcase, MapPin, Clock } from 'lucide-react';

export default function CareersPage() {
  const openPositions = [
    {
      title: 'Senior Frontend Developer',
      location: 'Remote',
      type: 'Full-time',
      department: 'Engineering',
    },
    {
      title: 'UI/UX Designer',
      location: 'Remote',
      type: 'Full-time',
      department: 'Design',
    },
    {
      title: 'Content Manager',
      location: 'Remote',
      type: 'Part-time',
      department: 'Content',
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Flag size={32} className="text-[#009ab6]" />
          <h1 className="text-4xl font-black text-black">Careers</h1>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-black mb-4">Join Our Team</h2>
          <p className="text-gray-700 text-lg">
            We're always looking for talented individuals to join our team. If you're passionate about 
            design, technology, and flags, we'd love to hear from you.
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-black mb-6">Open Positions</h2>
          <div className="space-y-4">
            {openPositions.map((position, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">{position.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        <span>{position.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>{position.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase size={16} />
                        <span>{position.department}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="bg-[#009ab6] hover:bg-[#007a8a] text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-black mb-4">Don't See a Position That Fits?</h2>
          <p className="text-gray-700 mb-4">
            We're always interested in hearing from exceptional candidates. Send us your resume and 
            a brief note about why you'd like to join FlagStock.
          </p>
          <a
            href="mailto:careers@flagstock.com"
            className="inline-block bg-[#009ab6] hover:bg-[#007a8a] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Send Your Resume
          </a>
        </div>
      </div>
    </main>
  );
}
