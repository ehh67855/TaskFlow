"use client";

import React from "react";
import { motion } from "framer-motion";
import { AuroraBackground } from "@/components/ui/aurora-background";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export {
  //LandingPageClientAurora as LandingPageClient,
  LandingPageClientWaves as LandingPageClient,
};

import { useTheme } from "next-themes";
import { Waves } from "@/components/ui/waves-background";
import { SparklesText } from "@/components/ui/sparkles-text";
import { siteConfig } from "@/config/site";

function LandingPageClientWaves() {
  const { theme } = useTheme();

  return (
    <div className="relative w-full h-screen bg-background/80 rounded-lg overflow-hidden">
      <div className="absolute inset-0">
        <Waves
          lineColor={
            theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"
          }
          backgroundColor="transparent"
          waveSpeedX={0.02}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={12}
          yGap={36}
        />
      </div>

      <div className="relative z-10 p-8">
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="relative flex flex-col gap-4 items-center justify-center px-4"
        >
          <div className="text-3xl md:text-7xl font-bold dark:text-white text-center">
            {siteConfig.name}
          </div>
          <div className="font-extralight text-base md:text-4xl dark:text-neutral-200 py-4">
            sub text
          </div>
          <p className="font-extralight text-base md:text-2xl dark:text-neutral-200 py-4">
            Please log in or sign up to continue.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              asChild
              className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-4 py-2"
            >
              <Link href="/login">Log In</Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-4 py-2"
            >
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function LandingPageClientAurora() {
  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4"
      >
        <div className="text-3xl md:text-7xl font-bold dark:text-white text-center flex flex-row gap-4 items-center">
          <SparklesText text={`Welcome to ${siteConfig.name}!`} />
        </div>
        <div className="font-extralight text-base md:text-4xl dark:text-neutral-200 py-4">
          Your Sound, Your Archive – Store and Share Your Musical Journey.
        </div>
        <p className="font-extralight text-base md:text-2xl dark:text-neutral-200 py-4">
          Please log in or sign up to continue.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            asChild
            className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-4 py-2"
          >
            <Link href="/login">Log In</Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-4 py-2"
          >
            <Link href="/register">Sign Up</Link>
          </Button>
        </div>
      </motion.div>
    </AuroraBackground>
  );
}
