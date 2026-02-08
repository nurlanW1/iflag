import { Flag, Download, FileText, Image as ImageIcon } from 'lucide-react';

export default function PressPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Flag size={32} className="text-[#009ab6]" />
          <h1 className="text-4xl font-black text-black">Press Kit</h1>
        </div>

        <div className="mb-12">
          <p className="text-lg text-gray-700 mb-6">
            Welcome to the FlagStock Press Kit. Here you'll find logos, brand guidelines, and other 
            resources for media and press use.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <ImageIcon className="text-[#009ab6]" size={24} />
              <h2 className="text-xl font-bold text-black">Logos</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Download our logo in various formats and sizes for use in articles and publications.
            </p>
            <button className="bg-[#009ab6] hover:bg-[#007a8a] text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
              <Download size={18} />
              Download Logos
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-[#009ab6]" size={24} />
              <h2 className="text-xl font-bold text-black">Brand Guidelines</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Learn about our brand identity, color palette, and usage guidelines.
            </p>
            <button className="bg-[#009ab6] hover:bg-[#007a8a] text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
              <Download size={18} />
              Download Guidelines
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-black mb-4">Media Inquiries</h2>
          <p className="text-gray-700 mb-4">
            For media inquiries, interview requests, or additional press materials, please contact us at:
          </p>
          <a
            href="mailto:press@flagstock.com"
            className="text-[#009ab6] hover:underline font-semibold"
          >
            press@flagstock.com
          </a>
        </div>
      </div>
    </main>
  );
}
