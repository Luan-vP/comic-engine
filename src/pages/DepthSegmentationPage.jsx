import React from 'react';
import { DepthSegmentationDemo } from '../components/DepthSegmentationDemo';

/**
 * DepthSegmentationPage - Demo page for the photo-to-layers pipeline
 *
 * This page showcases the depth segmentation pipeline that converts
 * a single photograph into multiple depth-based layers for parallax effects.
 */
export function DepthSegmentationPage() {
  return <DepthSegmentationDemo />;
}

export default DepthSegmentationPage;
