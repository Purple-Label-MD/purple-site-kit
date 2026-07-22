import { Shell } from "@/components/Shell";
import { CounselBanner, PlaceholderNote } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";

/** Contact page — a required contact/identity surface for certification review. */
export default function ContactPage() {
  const brand = getActiveBrand();
  return (
    <Shell brand={brand}>
      <section className="section">
        <div className="container">
          <div className="eyebrow">Contact</div>
          <h1>Contact {brand.name}</h1>
          <PlaceholderNote>
            real contact details are required before launch and for certification
          </PlaceholderNote>
          <CounselBanner topic="contact + entity disclosure surface" />
          <ul>
            <li>Support email: [support@example — placeholder]</li>
            <li>Phone: [phone — placeholder]</li>
            <li>Mailing address: [operating entity address — placeholder]</li>
            <li>Hours / response window: [placeholder]</li>
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
