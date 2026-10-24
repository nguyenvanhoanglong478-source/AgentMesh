using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("VANG — 3D Audio Player for Spotify")]
[assembly: AssemblyDescription("Standalone Desktop Application for VANG 3D Audio Player")]
[assembly: AssemblyProduct("VANG")]
[assembly: AssemblyVersion("1.0.0.0")]

namespace VangApp
{
    internal static class Program
    {
        private static byte[] LoadResource(string name)
        {
            Assembly asm = Assembly.GetExecutingAssembly();
            using (Stream s = asm.GetManifestResourceStream(name))
            {
                if (s == null) return new byte[0];
                using (MemoryStream ms = new MemoryStream())
                {
                    s.CopyTo(ms);
                    return ms.ToArray();
                }
            }
        }

        private static int FindPort(int preferred)
        {
            try
            {
                TcpListener l = new TcpListener(IPAddress.Loopback, preferred);
                l.Start();
                l.Stop();
                return preferred;
            }
            catch
            {
                TcpListener l = new TcpListener(IPAddress.Loopback, 0);
                l.Start();
                int port = ((IPEndPoint)l.LocalEndpoint).Port;
                l.Stop();
                return port;
            }
        }

        private static string FindAppBrowser()
        {
            string[] candidates = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };
            foreach (string path in candidates)
            {
                if (!string.IsNullOrEmpty(path) && File.Exists(path))
                    return path;
            }
            return null;
        }

        [STAThread]
        private static void Main()
        {
            byte[] htmlBytes = LoadResource("index.html");
            byte[] manifestBytes = LoadResource("manifest.webmanifest");
            byte[] swBytes = LoadResource("sw.js");
            byte[] iconBytes = LoadResource("icon.svg");

            int port = FindPort(17890);
            string baseUrl = "http://127.0.0.1:" + port + "/index.html";

            TcpListener server = new TcpListener(IPAddress.Loopback, port);
            server.Start();

            DateTime lastActivity = DateTime.UtcNow;
            bool running = true;

            Thread serverThread = new Thread(() =>
            {
                while (running)
                {
                    try
                    {
                        if (!server.Pending())
                        {
                            Thread.Sleep(25);
                            continue;
                        }
                        TcpClient client = server.AcceptTcpClient();
                        ThreadPool.QueueUserWorkItem(_ =>
                        {
                            try
                            {
                                using (client)
                                using (NetworkStream ns = client.GetStream())
                                using (StreamReader reader = new StreamReader(ns, Encoding.ASCII, false, 1024, true))
                                {
                                    string reqLine = reader.ReadLine();
                                    if (string.IsNullOrEmpty(reqLine)) return;
                                    lastActivity = DateTime.UtcNow;

                                    string[] parts = reqLine.Split(' ');
                                    string rawPath = parts.Length > 1 ? parts[1] : "/";
                                    int qIdx = rawPath.IndexOf('?');
                                    string cleanPath = qIdx >= 0 ? rawPath.Substring(0, qIdx) : rawPath;

                                    byte[] body = htmlBytes;
                                    string contentType = "text/html; charset=utf-8";

                                    if (cleanPath.EndsWith("manifest.webmanifest"))
                                    {
                                        body = manifestBytes;
                                        contentType = "application/manifest+json; charset=utf-8";
                                    }
                                    else if (cleanPath.EndsWith("sw.js"))
                                    {
                                        body = swBytes;
                                        contentType = "application/javascript; charset=utf-8";
                                    }
                                    else if (cleanPath.EndsWith("icon.svg"))
                                    {
                                        body = iconBytes;
                                        contentType = "image/svg+xml";
                                    }

                                    string header =
                                        "HTTP/1.1 200 OK\r\n" +
                                        "Content-Type: " + contentType + "\r\n" +
                                        "Content-Length: " + body.Length + "\r\n" +
                                        "Cache-Control: no-cache\r\n" +
                                        "Connection: close\r\n\r\n";
                                    byte[] headerBytes = Encoding.ASCII.GetBytes(header);
                                    ns.Write(headerBytes, 0, headerBytes.Length);
                                    ns.Write(body, 0, body.Length);
                                    ns.Flush();
                                }
                            }
                            catch { }
                        });
                    }
                    catch { }
                }
            });
            serverThread.IsBackground = true;
            serverThread.Start();

            string browserExe = FindAppBrowser();
            Process proc = null;
            try
            {
                if (browserExe != null)
                {
                    string profileDir = Path.Combine(Path.GetTempPath(), "VangStandaloneAppProfile");
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = browserExe,
                        Arguments = "--app=\"" + baseUrl + "\" --window-size=1320,840 --user-data-dir=\"" + profileDir + "\" --no-first-run --no-default-browser-check",
                        UseShellExecute = false
                    };
                    proc = Process.Start(psi);
                }
                else
                {
                    Process.Start(new ProcessStartInfo { FileName = baseUrl, UseShellExecute = true });
                }
            }
            catch
            {
                try { Process.Start(new ProcessStartInfo { FileName = baseUrl, UseShellExecute = true }); } catch { }
            }

            if (proc != null)
            {
                proc.WaitForExit();
            }
            else
            {
                while ((DateTime.UtcNow - lastActivity).TotalMinutes < 30)
                {
                    Thread.Sleep(2000);
                }
            }

            running = false;
            try { server.Stop(); } catch { }
        }
    }
}
