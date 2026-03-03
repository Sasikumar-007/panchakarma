export default function Logo({ size = 40 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#16A34A" />
                </linearGradient>
            </defs>
            <rect width="100" height="100" rx="20" fill="url(#logo-gradient)" />
            {/* Medical Cross */}
            <path d="M40 25H60V75H40V25Z" fill="white" />
            <path d="M25 40H75V60H25V40Z" fill="white" />
            {/* Ayurvedic Leaf (Minimalist) overlay */}
            <path d="M50 25C50 25 70 25 70 45C70 65 50 75 50 75C50 75 30 65 30 45C30 25 50 25 50 25Z" fill="rgba(255,255,255,0.85)" />
            {/* Inner green/blue cross over leaf to show interaction */}
            <path d="M45 40H55V60H45V40Z" fill="url(#logo-gradient)" />
            <path d="M35 45H65V55H35V45Z" fill="url(#logo-gradient)" />
        </svg>
    );
}
