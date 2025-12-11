// pages/_app.js
import "../styles/globals.css";
import { CourseProvider } from "../context/CourseContext";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CourseProvider>
          <Component {...pageProps} />
        </CourseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;
