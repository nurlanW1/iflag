import { Flag } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Flag size={32} className="text-[#009ab6]" />
          <h1 className="text-4xl font-black text-black">About Us</h1>
        </div>

        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-gray-700 mb-6">
            Welcome to FlagStock, the world's largest flag database and marketplace. We're dedicated to providing 
            high-quality flag assets for designers, developers, and creators worldwide.
          </p>

          <h2 className="text-2xl font-bold text-black mt-8 mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-6">
            Our mission is to make high-quality flag assets accessible to everyone. Whether you're working on a 
            web project, mobile app, presentation, or any creative endeavor, we provide the flags you need in 
            multiple formats and resolutions.
          </p>

          <h2 className="text-2xl font-bold text-black mt-8 mb-4">What We Offer</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>Thousands of high-resolution flag images</li>
            <li>Vector formats (SVG, AI, EPS) for scalable designs</li>
            <li>Raster images (PNG, JPG) in various resolutions</li>
            <li>Video assets for dynamic presentations</li>
            <li>Commercial licenses for professional use</li>
            <li>Regular updates with new flags and formats</li>
          </ul>

          <h2 className="text-2xl font-bold text-black mt-8 mb-4">Our Team</h2>
          <p className="text-gray-700 mb-6">
            FlagStock is built by a passionate team of designers, developers, and flag enthusiasts who understand 
            the importance of quality assets in creative projects. We're constantly working to expand our 
            collection and improve our platform.
          </p>

          <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Us</h2>
          <p className="text-gray-700">
            Have questions or suggestions? We'd love to hear from you. Reach out to us at{' '}
            <a href="mailto:support@flagstock.com" className="text-[#009ab6] hover:underline">
              support@flagstock.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
