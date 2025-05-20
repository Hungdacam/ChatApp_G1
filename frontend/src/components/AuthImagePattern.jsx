import React from 'react'

const AuthImagePattern = ({title, subtitle}) => {
  return (
    <div className='flex items-center justify-center bg-gray-900 p-12 h-screen'>
        <div className='max-w-md text-center'>
            <div className='grid grid-cols-3 gap-3 mb-8'>
            {[...Array(9)].map((_, i) => (
                <div
                key={i}
                className={`aspect-square rounded-2xl bg-indigo-900/40 ${
                    i%2 === 0 ? "animate-pulse" : ""
                }`}
                />
            ))}
            </div>
            <h2 className='text-2xl font-bold mb-4 text-white'>{title || "Join our community"}</h2>
            <p className='text-gray-400'>{subtitle || "Connect with friends, share moments, and stay in touch with your network"}</p>
        </div>
    </div>
  )
}

export default AuthImagePattern
