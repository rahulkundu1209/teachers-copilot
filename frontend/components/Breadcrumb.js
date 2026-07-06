import Link from "next/link";
import { useRouter } from "next/router";

export default function Breadcrumb({ backHref, items = [] }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 mb-4 text-sm text-slate-500">
      <button
        onClick={() => router.push(backHref)}
        className="text-5xl font-bold leading-none text-slate-700 hover:text-slate-900 transition"
        aria-label="Go Back"
      >
        ←
      </button>

      <div className="flex items-center flex-wrap">
        {items.map((item, index) => (
          <span key={index} className="flex items-center">
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-indigo-600 hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-700">
                {item.label}
              </span>
            )}

            {index < items.length - 1 && (
              <span className="mx-2 text-slate-400">&gt;</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}