import { Shell } from "@/components/Shell";
import { ClinicianBios } from "@/components/patterns";
import { PlaceholderNote } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description:
    "Who we are — the identity and entity-disclosure surface a certification review looks for. Placeholder scaffolding; replace with verifiable details.",
});

/** About page — identity surface (a certification-readiness element). */
export default function AboutPage() {
  const brand = getActiveBrand();
  return (
    <Shell brand={brand}>
      <section className="section">
        <div className="container">
          <div className="eyebrow">About</div>
          <h1>About {brand.name}</h1>
          {brand.aboutBody?.length ? (
            <>
              {brand.aboutBody.map((para) => (
                <p key={para.slice(0, 40)} style={{ maxWidth: 640 }}>
                  {para}
                </p>
              ))}
              {brand.contact?.supportEmail ? (
                <p className="muted">
                  Reach a human any time: <a href="/contact">{brand.contact.supportEmail}</a>
                </p>
              ) : null}
            </>
          ) : (
            <>
              <PlaceholderNote>
                company identity + mission — replace with real, verifiable details
              </PlaceholderNote>
              <p style={{ maxWidth: 640 }}>
                This is placeholder About copy. State clearly who operates this service, the
                relationship between the technology platform and the independent medical practice,
                and how patients reach a human. Entity/identity transparency is a
                certification-readiness element.
              </p>
              <ul className="muted">
                <li>[Legal operating entity name + address slot]</li>
                <li>[Platform-vs-medical-practice separation disclosure slot]</li>
                <li>[Contact + support channel slot]</li>
              </ul>
            </>
          )}
        </div>
      </section>
      <ClinicianBios brand={brand} />
    </Shell>
  );
}
