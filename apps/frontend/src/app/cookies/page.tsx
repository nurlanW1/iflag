import { Flag, Cookie } from 'lucide-react';

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Cookie size={32} className="text-[#009ab6]" />
          <h1 className="text-4xl font-black text-black">Cookie Policy</h1>
        </div>

        <div className="prose prose-lg max-w-none">
          <p className="text-sm text-gray-600 mb-8">Last updated: January 2024</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">What Are Cookies?</h2>
            <p className="text-gray-700 mb-4">
              Cookies are small text files that are placed on your computer or mobile device when you 
              visit a website. They are widely used to make websites work more efficiently and provide 
              information to the website owners.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">How We Use Cookies</h2>
            <p className="text-gray-700 mb-4">
              FlagStock uses cookies for the following purposes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
              <li><strong>Authentication:</strong> To keep you logged in and maintain your session</li>
              <li><strong>Preferences:</strong> To remember your settings and preferences</li>
              <li><strong>Analytics:</strong> To understand how visitors use our website</li>
              <li><strong>Marketing:</strong> To deliver relevant advertisements (with your consent)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-black mb-2">Session Cookies</h3>
                <p className="text-gray-700">
                  Temporary cookies that are deleted when you close your browser. These are essential 
                  for the website to function.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-black mb-2">Persistent Cookies</h3>
                <p className="text-gray-700">
                  Cookies that remain on your device for a set period or until you delete them. These 
                  help us remember your preferences.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Managing Cookies</h2>
            <p className="text-gray-700 mb-4">
              You can control and manage cookies in various ways:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Browser settings allow you to refuse or accept cookies</li>
              <li>You can delete cookies that have already been set</li>
              <li>Most browsers will notify you when cookies are being used</li>
              <li>Note that blocking cookies may affect website functionality</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Third-Party Cookies</h2>
            <p className="text-gray-700 mb-4">
              Some cookies are placed by third-party services that appear on our pages. These may 
              include analytics services, advertising networks, and social media platforms. We do not 
              control these cookies, so please refer to the third party's privacy policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about our use of cookies, please contact us at{' '}
              <a href="mailto:support@flagstock.com" className="text-[#009ab6] hover:underline">
                support@flagstock.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
