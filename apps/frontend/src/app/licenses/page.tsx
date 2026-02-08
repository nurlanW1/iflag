import { Flag, FileText, CheckCircle } from 'lucide-react';

export default function LicensesPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <FileText size={32} className="text-[#009ab6]" />
          <h1 className="text-4xl font-black text-black">License Information</h1>
        </div>

        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-gray-700 mb-8">
            Understanding our licensing terms is important for using FlagStock assets correctly. 
            Below are the different license types available.
          </p>

          <section className="mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-[#009ab6]" size={24} />
                <h2 className="text-2xl font-bold text-black">Free License</h2>
              </div>
              <p className="text-gray-700 mb-4">
                Free downloads come with a basic license that allows:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Personal and non-commercial use</li>
                <li>Limited commercial use (up to 1,000 units)</li>
                <li>Attribution required in some cases</li>
                <li>No redistribution rights</li>
              </ul>
            </div>

            <div className="bg-white border border-[#009ab6] rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-[#009ab6]" size={24} />
                <h2 className="text-2xl font-bold text-black">Premium License</h2>
              </div>
              <p className="text-gray-700 mb-4">
                Premium subscriptions include a commercial license that allows:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Unlimited commercial use</li>
                <li>No attribution required</li>
                <li>Use in products for sale</li>
                <li>Use in client projects</li>
                <li>Modification and derivative works</li>
                <li>Extended redistribution rights</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">What You Cannot Do</h2>
            <p className="text-gray-700 mb-4">
              Regardless of license type, you cannot:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Resell or redistribute flags as standalone products</li>
              <li>Use flags in trademark or logo designs</li>
              <li>Use flags in ways that violate laws or regulations</li>
              <li>Claim ownership of the flag designs</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Questions About Licensing?</h2>
            <p className="text-gray-700">
              If you have questions about licensing or need clarification on usage rights, please 
              contact us at{' '}
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
