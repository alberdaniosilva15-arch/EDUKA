"use client";

import { Suspense } from "react";
import Spline from "@splinetool/react-spline";

export default function SplineScene() {
  return (
    <div className="spline-container" style={{ width: "100%", height: "100%", minHeight: "500px", position: "relative" }}>
      <Suspense fallback={<div className="spline-loading">A carregar 3D...</div>}>
        <Spline scene="https://prod.spline.design/M2Qnm9Ch-yEghtpq/scene.splinecode" />
      </Suspense>
    </div>
  );
}
