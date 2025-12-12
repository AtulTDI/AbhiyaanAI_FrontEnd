import { GetPaginatedImages, Image } from "../types/Image";
import axios from "./axiosInstance";

/**
 * Get paginated images with optional search
 */
export const getImages = (pageNumber, pageSize) =>
  axios.get<GetPaginatedImages>(`/ImageCampaign/get-image-campaigns?page=${pageNumber + 1}&pageSize=${pageSize}`, { useApiPrefix: true });

/**
 * Get paginated campaigns with optional search
 */
export const getCampaigns = (pageNumber, pageSize) =>
  axios.get(`/ImageCampaign/get-shared-image-campaigns?page=${pageNumber + 1}&pageSize=${pageSize}`, { useApiPrefix: true });

/**
 * Upload Images
 */
export const uploadImages = (data: any) =>
  axios.post("/ImageCampaign/upload-images", data, {
    useApiPrefix: true
  });

/**
 * Share image by ID
 */
export const shareImageById = (id: string, payload: boolean) =>
  axios.put<Image>(`/ImageCampaign/${id}/share-image-campaign`, payload, { useApiPrefix: true });


/**
 * Update image by ID
 */
export const updateImageById = (id: string, payload) =>
  axios.put(`/ImageCampaign/${id}/update-campaign`, payload, { useApiPrefix: true });

/**
 * Delete image by ID
 */
export const deleteImageById = (id: string) =>
  axios.delete(`/ImageCampaign/${id}/delete-image-campaign`, { useApiPrefix: true });
