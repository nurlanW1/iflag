import { deriveFlagLabel } from '@/lib/seo/flag-educational-copy';

type Props = {
  productTitle: string;
};

/**
 * Generic, non-claimy educational copy for SEO and readers (not a substitute for official specs).
 */
export function FlagEducationalSections({ productTitle }: Props) {
  const label = deriveFlagLabel(productTitle);
  const subject = label;

  return (
    <article className="mt-12 max-w-none border-t border-gray-100 pt-10">
      <p className="text-sm text-gray-600">
        Reference notes for visitors and search engines. For regulated or official use, verify colors,
        proportions, and usage rules against authoritative sources.
      </p>

      <section className="mt-8 space-y-3" aria-labelledby="meaning-heading">
        <h2 id="meaning-heading" className="text-lg font-bold text-gray-900">
          Meaning of the {subject} flag
        </h2>
        <p className="text-sm leading-relaxed text-gray-700">
          Flags stand for a country, territory, or institution in public life. The {subject} flag is used to
          represent {subject} in civic ceremonies, international events, and everyday communication. The
          exact meaning of emblems and colors is often defined by history and law; interpretations can vary
          by context.
        </p>
      </section>

      <section className="mt-8 space-y-3" aria-labelledby="colors-heading">
        <h2 id="colors-heading" className="text-lg font-bold text-gray-900">
          Colors of the flag
        </h2>
        <p className="text-sm leading-relaxed text-gray-700">
          National and organizational flags combine colors and symbols so the design can be recognized at a
          distance. Color choices frequently reflect historical events, regional identity, or earlier heraldic
          traditions. Digital files in a marketplace are practical assets for design work; they are not
          certified copies of official color standards unless explicitly stated in the product listing.
        </p>
      </section>

      <section className="mt-8 space-y-3" aria-labelledby="history-heading">
        <h2 id="history-heading" className="text-lg font-bold text-gray-900">
          History of the flag
        </h2>
        <p className="text-sm leading-relaxed text-gray-700">
          Most flags change slowly over time: independence, union, or political transition can lead to new
          designs or adjustments to existing ones. If you need a date-specific design (for example, a
          historical re-enactment), confirm which version applies to your project and cite reliable historical or governmental references.
        </p>
      </section>

      <section className="mt-8 space-y-3" aria-labelledby="usage-heading">
        <h2 id="usage-heading" className="text-lg font-bold text-gray-900">
          Where the flag is used
        </h2>
        <p className="text-sm leading-relaxed text-gray-700">
          You will see the {subject} flag on public buildings, at sporting and cultural events, in maps and
          educational materials, and in digital products such as apps and presentations. Respect platform
          rules, copyright and trademark limitations, and any local rules that apply to political or
          sensitive imagery when you publish your work.
        </p>
      </section>
    </article>
  );
}
