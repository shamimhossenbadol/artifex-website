"use client";
// Hero slides (ADR-039): background photos for the homepage hero, shown in this order.
import {
  deleteHeroSlideAction,
  moveHeroSlideAction,
  updateHeroSlideAltAction,
  uploadHeroSlideAction,
} from "@/server/actions/home.actions";
import type { AdminHeroSlide } from "@/server/services/home-admin.service";
import { PhotoManager, type PhotoActions } from "../PhotoManager";

const actions: PhotoActions = {
  upload: (file) => {
    const formData = new FormData();
    formData.set("file", file);
    return uploadHeroSlideAction(formData);
  },
  setAlt: updateHeroSlideAltAction,
  move: moveHeroSlideAction,
  remove: deleteHeroSlideAction,
};

export function HeroSlides({ slides, max }: { slides: AdminHeroSlide[]; max: number }) {
  return (
    <PhotoManager
      images={slides}
      max={max}
      actions={actions}
      aspect="aspect-[16/9]"
      limitMessage={`Up to ${max} hero photos.`}
      emptyMessage="No photos yet. Until you add one, the homepage shows the text on a plain background."
      deleteDescription="The photo is removed from the homepage. This can't be undone."
    />
  );
}
