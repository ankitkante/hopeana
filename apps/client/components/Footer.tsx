export default function Footer() {
    return (
        <footer className="bg-white p-4 text-gray-500 border-t border-gray-200 flex  align-center ">
            <div className="flex-1">© {new Date().getFullYear()} Ankit Kante. All rights reserved.</div>
            <div className="flex-1 text-right">
                <a href="#" className="ml-4">
                    About Us
                </a>
                <a href="#" className="ml-4">
                    Contact
                </a>
                <a href="#" className="ml-4">
                    Terms of Service
                </a>
            </div>
        </footer>
    )
}