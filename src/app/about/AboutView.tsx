"use client";

import { PhotoImage } from "@/components/PhotoImage";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useLocale } from "@/contexts/LocaleContext";
import { pickLocalized, splitParagraphs, type ProfileTextField } from "@/lib/aboutContent";
import type { AboutProfileView, ProjectView } from "@/lib/aboutStore";
import { ProjectRow } from "./ProjectRow";

export function AboutView({
  profile,
  projects,
  portraitSrc,
}: {
  profile: AboutProfileView;
  projects: ProjectView[];
  portraitSrc: string;
}) {
  const { t, locale } = useLocale();
  const text = (field: ProfileTextField) => pickLocalized(profile[field], locale).trim();

  const paragraphs = splitParagraphs(text("intro"));
  const facts = [
    { label: text("fact1Label"), value: text("fact1Value") },
    { label: text("fact2Label"), value: text("fact2Value") },
  ].filter((fact) => fact.value);
  const sections = [
    { label: t("about.collabLabel"), title: text("collabTitle"), body: text("collabBody") },
    { label: t("about.joinLabel"), title: text("joinTitle"), body: text("joinBody") },
  ].filter((section) => section.body);

  return (
    <div className="about-page pb-16">
      <section className="site-container mx-auto mb-24 md:mb-40">
        <div className="asymmetric-grid items-start">
          <ScrollReveal className="col-span-12 md:col-span-5 image-hover-zoom relative min-h-[min(70vh,640px)] bg-surface">
            <PhotoImage
              src={portraitSrc}
              alt={t("about.portraitAlt")}
              fill
              className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
              sizes="(max-width: 768px) 100vw, 42vw"
              priority
            />
          </ScrollReveal>
          <div className="col-span-12 md:col-span-6 md:col-start-7 mt-10 md:mt-24 min-w-0">
            <ScrollReveal delayMs={120}>
              <span className="section-label block mb-6 tracking-widest">{t("about.eyebrow")}</span>
              <h1 className="type-display-lg text-fg leading-tight break-words">
                {text("headline")}
              </h1>
              {paragraphs.length > 0 && (
                <div className="mt-10 md:mt-12 space-y-6 type-body-lg text-muted reading">
                  {paragraphs.map((paragraph, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
              {facts.length > 0 && (
                <div className="mt-10 pt-8 border-t border-border flex flex-wrap gap-x-12 gap-y-6">
                  {facts.map((fact, i) => (
                    <div key={i}>
                      {fact.label && (
                        <span className="section-label block mb-1 !text-fg">{fact.label}</span>
                      )}
                      <span className="type-headline-sm text-fg">{fact.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollReveal>
          </div>
        </div>
      </section>

      {projects.length > 0 && (
        <section className="surface-band py-20 md:py-32 mb-24 md:mb-40">
          <div className="site-container mx-auto">
            <ScrollReveal>
              <div className="editorial-section-header !mb-4">
                <div>
                  <span className="section-label block mb-4">{t("about.projectsEyebrow")}</span>
                  <h2 className="type-headline-md text-fg">{t("about.projectsHeading")}</h2>
                </div>
                <span className="type-caption tabular-nums">
                  {t("about.projectsCount", { count: projects.length })}
                </span>
              </div>
            </ScrollReveal>
            <div>
              {projects.map((project, i) => (
                <ScrollReveal key={project.id} delayMs={60 * Math.min(i, 5)}>
                  <ProjectRow project={project} index={i} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="site-container mx-auto">
        <div className="asymmetric-grid">
          <ScrollReveal className="col-span-12 md:col-span-5">
            <span className="section-label block mb-6">{t("about.collabEyebrow")}</span>
            <h2 className="about-collab-heading type-display-lg text-fg leading-tight">
              {t("about.collabHeading")}
            </h2>
            <div className="stitch-gold-line mt-8" />
          </ScrollReveal>
          {sections.length > 0 && (
            <ScrollReveal
              delayMs={150}
              className={`col-span-12 md:col-span-6 md:col-start-7 mt-12 md:mt-3 grid gap-12 ${
                sections.length > 1 ? "sm:grid-cols-2" : ""
              }`}
            >
              {sections.map((section) => (
                <div key={section.label} className="min-w-0">
                  <span className="section-label block">{section.label}</span>
                  {section.title && (
                    <h3 className="type-headline-sm text-fg mt-3">{section.title}</h3>
                  )}
                  <p className="text-muted reading mt-3 whitespace-pre-line">{section.body}</p>
                </div>
              ))}
            </ScrollReveal>
          )}
          <ScrollReveal className="col-span-12 mt-16 pt-10 border-t border-border flex flex-wrap items-end justify-between gap-8">
            <div className="min-w-0">
              <span className="section-label block mb-3">{t("about.emailLabel")}</span>
              <a href={`mailto:${profile.email}`} className="about-email text-fg">
                {profile.email}
              </a>
            </div>
            <a href={`mailto:${profile.email}`} className="button-primary">
              {t("about.writeMe")}
            </a>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
