import neutral from '@/config/profiles/neutral.json'
import template from '@/config/profiles/template.json'
import { cache } from "react";
import connectDB from "@/lib/db/connect";
import DealershipModel from "@/lib/db/models/dealership.model";
import type { DealershipInfo } from "../../types/dealership";

/**
 * Builds the default DealershipInfo, seeded from environment variables
 * where applicable. Used both as the initial DB document and as the
 * fallback when the database is unreachable.
 */
function buildDefaults(): DealershipInfo {
  const profile = process.env.DEALER_PROFILE === 'neutral' ? neutral : template;
  return { ...profile, name:process.env.DEALER_NAME || profile.name, email:process.env.DEALER_PUBLIC_EMAIL ?? profile.email };

}

/**
 * Fetches the dealership's display information from MongoDB.
 *
 * - Missing settings use the configured public profile; reads never seed a database.
 * - Wrapped in React's `cache()` so it is deduplicated within a single
 *   request — e.g. `generateMetadata` and the root layout both call this
 *   but only one database query is made.
 * - If the database is unreachable (e.g. during a build without DATABASE_URI),
 *   it falls back gracefully to the env-based defaults so the build succeeds.
 */
export const getDealershipInfo = cache(async (): Promise<DealershipInfo> => {
  try {
    await connectDB();

    // Reads never seed or update a dealer database.
    const doc = await DealershipModel.findOne({ _isDealershipSettings: true }).lean();

    if (!doc) {
      return buildDefaults();
    }

    const defaults = buildDefaults();
    const isStarterRecord = !doc.name || ["My Dealership", "Dealership"].includes(doc.name);

    return {
      name: isStarterRecord ? defaults.name : doc.name,
      tagline: isStarterRecord ? defaults.tagline : doc.tagline,
      email: isStarterRecord && (!doc.email || doc.email === "info@dealership.co.uk") ? defaults.email : doc.email,
      phone: isStarterRecord && !doc.phone ? defaults.phone : doc.phone,
      whatsapp: isStarterRecord && !doc.whatsapp ? defaults.whatsapp : doc.whatsapp,
      address: {
        line1: isStarterRecord && doc.address?.line1 === "123 Motor Way" ? defaults.address.line1 : (doc.address?.line1 ?? ""),
        line2: doc.address?.line2 ?? "",
        city: isStarterRecord && doc.address?.city === "London" ? defaults.address.city : (doc.address?.city ?? ""),
        postcode: isStarterRecord && doc.address?.postcode === "W1A 1AA" ? defaults.address.postcode : (doc.address?.postcode ?? ""),
        country: doc.address?.country ?? "UK",
      },
      logoUrl: doc.logoUrl,
      social: {
        facebook: doc.social?.facebook ?? "",
        instagram: doc.social?.instagram ?? "",
        twitter: doc.social?.twitter ?? "",
        youtube: doc.social?.youtube ?? "",
        tiktok: doc.social?.tiktok ?? "",
        linkedin: doc.social?.linkedin ?? "",
      },
      openingHours: {
        weekdays: doc.openingHours?.weekdays ?? "Monday – Friday: 9am – 6pm",
        saturday: doc.openingHours?.saturday ?? "Saturday: 9am – 5pm",
        sunday: doc.openingHours?.sunday ?? "Sunday: 10am – 4pm",
      },
      companyNumber: doc.companyNumber ?? "",
      fcaNumber: doc.fcaNumber ?? "",
      seoText: doc.seoText ?? "",
    };
  } catch (err) {
    // Database unavailable — return env-based defaults so pages still render
    console.error("[dealership.service] Public settings unavailable; configured profile in use");
    return buildDefaults();
  }
});
