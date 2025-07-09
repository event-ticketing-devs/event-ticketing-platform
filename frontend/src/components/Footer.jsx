export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-600 text-center py-4 mt-10 border-t">
      <div className="container mx-auto">
        <span>
          &copy; {new Date().getFullYear()} Eventify. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
