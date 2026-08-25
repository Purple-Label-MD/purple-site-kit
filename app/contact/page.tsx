import { Shell } from "@/components/Shell";
import { CounselBanner, PlaceholderNote } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "How to reach us — a required contact and entity-disclosure surface for certification review. Placeholder details; replace before launch.",
});

/** Contact page — a required contact/identity surface for certification review. */
export default function ContactPage() {
  const brand = getActiveBrand();
  return (
    <Shell brand={brand}>
      <section className="section">
        <div className="container">
          <div className="eyebrow">Contact</div>
          <h1>Contact {brand.name}</h1>
          {!brand.contentReviewed ? (
            <PlaceholderNote>
              real contact details are required before launch and for certification
            </PlaceholderNote>
          ) : null}
          <CounselBanner topic="contact + entity disclosure surface" />
          <ul>
            <li>
              Support email:{" "}
              {brand.contact?.supportEmail ? (
                <a href={`mailto:${brand.contact.supportEmail}`}>{brand.contact.supportEmail}</a>
              ) : (
                "[support@example — placeholder]"
              )}
            </li>
            <li>Phone: {brand.contact?.phone ?? "[phone — placeholder]"}</li>
            <li>
              Mailing address:{" "}
              {brand.contact?.address ?? "[operating entity address — placeholder]"}
            </li>
            <li>Hours / response window: {brand.contact?.hours ?? "[placeholder]"}</li>
          </ul>
          <p className="muted">
            A reachable contact surface with a real operating entity is a certification-readiness
            element. Do not launch with placeholder contact details.
          </p>
        </div>
      </section>
    </Shell>
  );
}
