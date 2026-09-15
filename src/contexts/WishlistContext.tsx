'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Vehicle interface for wishlist items
export interface WishlistVehicle {
  stockId: string
  title: string
  make?: string
  model?: string
  year?: string
  price?: string
  image?: string | null
  mileage?: string
  fuel?: string
  transmission?: string
}

interface WishlistContextType {
  wishlistItems: WishlistVehicle[]
  isInWishlist: (stockId: string) => boolean
  addToWishlist: (vehicle: WishlistVehicle) => void
  removeFromWishlist: (stockId: string) => void
  toggleWishlist: (vehicle: WishlistVehicle) => void
  clearWishlist: () => void
  wishlistCount: number
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

interface WishlistProviderProps {
  children: ReactNode
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistVehicle[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load wishlist from localStorage on component mount
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem('dummy-autos-wishlist')
      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist)
        setWishlistItems(parsedWishlist)
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('dummy-autos-wishlist', JSON.stringify(wishlistItems))
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error)
      }
    }
  }, [wishlistItems, isLoaded])

  const isInWishlist = (stockId: string): boolean => {
    return wishlistItems.some(item => item.stockId === stockId)
  }

  const addToWishlist = (vehicle: WishlistVehicle) => {
    setWishlistItems(prev => {
      // Check if vehicle is already in wishlist
      if (prev.some(item => item.stockId === vehicle.stockId)) {
        return prev
      }
      return [...prev, vehicle]
    })
  }

  const removeFromWishlist = (stockId: string) => {
    setWishlistItems(prev => prev.filter(item => item.stockId !== stockId))
  }

  const toggleWishlist = (vehicle: WishlistVehicle) => {
    if (isInWishlist(vehicle.stockId)) {
      removeFromWishlist(vehicle.stockId)
    } else {
      addToWishlist(vehicle)
    }
  }

  const clearWishlist = () => {
    setWishlistItems([])
  }

  const wishlistCount = wishlistItems.length

  const contextValue: WishlistContextType = {
    wishlistItems,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
    wishlistCount,
  }

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
