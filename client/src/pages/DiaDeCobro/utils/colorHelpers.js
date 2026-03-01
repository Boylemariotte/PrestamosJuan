/**
 * Helper to get the base color of a cartera
 */
export const getCarteraColor = (nombre, carteras) => {
    const cartera = carteras?.find(c => c.nombre === nombre);
    return cartera?.color || (nombre === 'K1' ? 'blue' : nombre === 'K2' ? 'green' : nombre === 'K3' ? 'orange' : 'gray');
};

/**
 * Get standard background color class
 */
export const getBgColorClass = (colorName) => {
    const colors = {
        slate: 'bg-slate-600', gray: 'bg-gray-600', red: 'bg-red-600',
        orange: 'bg-orange-600', amber: 'bg-amber-600', yellow: 'bg-yellow-600',
        lime: 'bg-lime-600', green: 'bg-green-600', emerald: 'bg-emerald-600',
        teal: 'bg-teal-600', cyan: 'bg-cyan-600', sky: 'bg-sky-600',
        blue: 'bg-blue-600', indigo: 'bg-indigo-600', violet: 'bg-violet-600',
        purple: 'bg-purple-600', fuchsia: 'bg-fuchsia-600', pink: 'bg-pink-600',
        rose: 'bg-rose-600',
    };
    return colors[colorName] || 'bg-blue-600';
};

/**
 * Get gradient background color class (for mañana section)
 */
export const getMañanaBgColorClass = (colorName) => {
    const colors = {
        slate: 'from-slate-600 to-slate-700', gray: 'from-gray-600 to-gray-700', red: 'from-red-600 to-red-700',
        orange: 'from-orange-600 to-orange-700', amber: 'from-amber-600 to-amber-700', yellow: 'from-yellow-600 to-yellow-700',
        lime: 'from-lime-600 to-lime-700', green: 'from-green-600 to-green-700', emerald: 'from-emerald-600 to-emerald-700',
        teal: 'from-teal-600 to-teal-700', cyan: 'from-cyan-600 to-cyan-700', sky: 'from-sky-600 to-sky-700',
        blue: 'from-blue-600 to-blue-700', indigo: 'from-indigo-600 to-indigo-700', violet: 'from-violet-600 to-violet-700',
        purple: 'from-purple-600 to-purple-700', fuchsia: 'from-fuchsia-600 to-fuchsia-700', pink: 'from-pink-600 to-pink-700',
        rose: 'from-rose-600 to-rose-700',
    };
    return colors[colorName] || 'from-blue-600 to-blue-700';
};

/**
 * Get filter button classes with gradients and shadows
 */
export const getFiltroBgClass = (colorName) => {
    const colors = {
        slate: 'from-slate-600 to-slate-700 border-slate-400/50 shadow-slate-500/25 hover:from-slate-500 hover:to-slate-600 hover:shadow-slate-400/30 focus:ring-slate-300/70 focus:ring-offset-slate-900/50',
        gray: 'from-gray-600 to-gray-700 border-gray-400/50 shadow-gray-500/25 hover:from-gray-500 hover:to-gray-600 hover:shadow-gray-400/30 focus:ring-gray-300/70 focus:ring-offset-gray-900/50',
        red: 'from-red-600 to-red-700 border-red-400/50 shadow-red-500/25 hover:from-red-500 hover:to-red-600 hover:shadow-red-400/30 focus:ring-red-300/70 focus:ring-offset-red-900/50',
        orange: 'from-orange-600 to-orange-700 border-orange-400/50 shadow-orange-500/25 hover:from-orange-500 hover:to-orange-600 hover:shadow-orange-400/30 focus:ring-orange-300/70 focus:ring-offset-orange-900/50',
        amber: 'from-amber-600 to-amber-700 border-amber-400/50 shadow-amber-500/25 hover:from-amber-500 hover:to-amber-600 hover:shadow-amber-400/30 focus:ring-amber-300/70 focus:ring-offset-amber-900/50',
        yellow: 'from-yellow-600 to-yellow-700 border-yellow-400/50 shadow-yellow-500/25 hover:from-yellow-500 hover:to-yellow-700 hover:shadow-yellow-400/30 focus:ring-yellow-300/70 focus:ring-offset-yellow-900/50',
        lime: 'from-lime-600 to-lime-700 border-lime-400/50 shadow-lime-500/25 hover:from-lime-500 hover:to-lime-600 hover:shadow-lime-400/30 focus:ring-lime-300/70 focus:ring-offset-lime-900/50',
        green: 'from-green-600 to-green-700 border-green-400/50 shadow-green-500/25 hover:from-green-500 hover:to-green-600 hover:shadow-green-400/30 focus:ring-green-300/70 focus:ring-offset-green-900/50',
        emerald: 'from-emerald-600 to-emerald-700 border-emerald-400/50 shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-emerald-400/30 focus:ring-emerald-300/70 focus:ring-offset-emerald-900/50',
        teal: 'from-teal-600 to-teal-700 border-teal-400/50 shadow-teal-500/25 hover:from-teal-500 hover:to-teal-600 hover:shadow-teal-400/30 focus:ring-teal-300/70 focus:ring-offset-teal-900/50',
        cyan: 'from-cyan-600 to-cyan-700 border-cyan-400/50 shadow-cyan-500/25 hover:from-cyan-500 hover:to-cyan-600 hover:shadow-cyan-400/30 focus:ring-cyan-300/70 focus:ring-offset-cyan-900/50',
        sky: 'from-sky-600 to-sky-700 border-sky-400/50 shadow-sky-500/25 hover:from-sky-500 hover:to-sky-600 hover:shadow-sky-400/30 focus:ring-sky-300/70 focus:ring-offset-sky-900/50',
        blue: 'from-blue-600 to-blue-700 border-blue-400/50 shadow-blue-500/25 hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-400/30 focus:ring-blue-300/70 focus:ring-offset-blue-900/50',
        indigo: 'from-indigo-600 to-indigo-700 border-indigo-400/50 shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-600 hover:shadow-indigo-400/30 focus:ring-indigo-300/70 focus:ring-offset-indigo-900/50',
        violet: 'from-violet-600 to-violet-700 border-violet-400/50 shadow-violet-500/25 hover:from-violet-500 hover:to-violet-600 hover:shadow-violet-400/30 focus:ring-violet-300/70 focus:ring-offset-violet-900/50',
        purple: 'from-purple-600 to-purple-700 border-purple-400/50 shadow-purple-500/25 hover:from-purple-500 hover:to-purple-600 hover:shadow-purple-400/30 focus:ring-purple-300/70 focus:ring-offset-purple-900/50',
        fuchsia: 'from-fuchsia-600 to-fuchsia-700 border-fuchsia-400/50 shadow-fuchsia-500/25 hover:from-fuchsia-500 hover:to-fuchsia-600 hover:shadow-fuchsia-400/30 focus:ring-fuchsia-300/70 focus:ring-offset-fuchsia-900/50',
        pink: 'from-pink-600 to-pink-700 border-pink-400/50 shadow-pink-500/25 hover:from-pink-500 hover:to-pink-600 hover:shadow-pink-400/30 focus:ring-pink-300/70 focus:ring-offset-pink-900/50',
        rose: 'from-rose-600 to-rose-700 border-rose-400/50 shadow-rose-500/25 hover:from-rose-500 hover:to-rose-600 hover:shadow-rose-400/30 focus:ring-rose-300/70 focus:ring-offset-rose-900/50',
    };
    return colors[colorName] || 'from-blue-600 to-blue-700 border-blue-400/50 shadow-blue-500/25';
};
