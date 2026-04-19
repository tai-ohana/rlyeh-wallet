'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/motion'

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  )
}
