"use client";

import dynamic from "next/dynamic";

export const ClientDesk = dynamic(() => import("./Desk").then((mod) => mod.Desk), {
  ssr: false,
  loading: () => <p className="loading">Opening the stage…</p>,
});
