"use client";
// Product photos (07 §3.2, §4) through the shared photo manager.
import {
  deleteImageAction,
  moveImageAction,
  setPrimaryImageAction,
  updateImageAltAction,
  uploadProductImageAction,
} from "@/server/actions/product.actions";
import type { AdminProductImage } from "@/server/services/product-admin.service";
import { PhotoManager, type PhotoActions } from "../PhotoManager";

export function ProductImages({
  productId,
  images,
  max,
}: {
  productId: number;
  images: AdminProductImage[];
  max: number;
}) {
  const actions: PhotoActions = {
    upload: (file) => {
      const formData = new FormData();
      formData.set("productId", String(productId));
      formData.set("file", file);
      return uploadProductImageAction(formData);
    },
    setAlt: updateImageAltAction,
    move: moveImageAction,
    remove: deleteImageAction,
    setPrimary: setPrimaryImageAction,
  };
  return (
    <PhotoManager
      images={images}
      max={max}
      actions={actions}
      limitMessage={`Up to ${max} photos per product: 1 main photo and ${max - 1} gallery photos.`}
      emptyMessage="No photos yet. The first photo becomes the main photo."
      deleteDescription="The photo is removed from the product and the website. This can't be undone."
    />
  );
}
