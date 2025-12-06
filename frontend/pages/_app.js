// pages/_app.js
import "../styles/globals.css";
import { CourseProvider } from "../context/CourseContext";
import { AuthProvider } from "../context/AuthContext";

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <CourseProvider>
        <Component {...pageProps} />
      </CourseProvider>
    </AuthProvider>
  );
}

export default MyApp;
