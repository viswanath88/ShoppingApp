export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-emerald-400 font-bold text-lg">ShopEasy</p>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} ShopEasy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
