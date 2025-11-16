"use client";

import React from "react";

export default function Home() {
	return (
		<section className="hero">
			<div className="container">
				<header className="header">
					<h1 className="title">
						Teach smarter. Inspire brighter.
					</h1>
					<p className="subtitle">
						Tools and resources designed for teachers — lesson planning, student
						engagement, and classroom creativity, all in one beautiful place.
					</p>
					<div className="ctas">
						<a className="btn primary" href="#">Get Started — It's Free</a>
						<a className="btn ghost" href="#features">See Features</a>
					</div>
				</header>

				<div className="visual" aria-hidden={true}>
					<svg className="blob" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
						<defs>
							<linearGradient id="g1" x1="0" x2="1">
								<stop offset="0%" stopColor="#7c3aed" />
								<stop offset="100%" stopColor="#06b6d4" />
							</linearGradient>
						</defs>
						<g transform="translate(300,300)">
							<path d="M120,-160C157,-120,184,-80,188,-36C191,8,171,56,140,96C109,136,68,168,22,180C-24,192,-72,184,-106,158C-140,132,-160,88,-172,40C-184,-8,-188,-60,-162,-102C-136,-144,-80,-166,-30,-178C20,-190,100,-200,120,-160Z" fill="url(#g1)" opacity="0.95"/>
						</g>
					</svg>
				</div>

				<section id="features" className="features">
					<article className="card">
						<h3>Plan Faster</h3>
						<p>Smart templates and AI-guided outlines to assemble lessons in minutes.</p>
					</article>
					<article className="card">
						<h3>Engage Students</h3>
						<p>Interactive activities and easy differentiation for every classroom.</p>
					</article>
					<article className="card">
						<h3>Track Growth</h3>
						<p>Visualize progress with simple dashboards and actionable insights.</p>
					</article>
				</section>

				<footer className="footnote">
					<p>Built for educators who want beautiful tools that just work.</p>
				</footer>
			</div>

			<style jsx>{`
				:root {
					--bg-1: #0f172a;
					--card-bg: rgba(255,255,255,0.04);
					--glass: rgba(255,255,255,0.06);
					--accent-from: #7c3aed;
					--accent-to: #06b6d4;
				}

				.hero {
					background: linear-gradient(180deg, rgba(10,8,20,1) 0%, rgba(6,8,20,0.9) 40%);
					color: #e6eef8;
					padding: 56px 20px;
					min-height: 76vh;
					display: flex;
					align-items: center;
				}

				.container {
					max-width: 1100px;
					margin: 0 auto;
					width: 100%;
					position: relative;
					display: grid;
					grid-template-columns: 1fr 420px;
					gap: 32px;
					align-items: center;
				}

				.header { z-index: 2 }

				.title {
					font-size: 2.1rem;
					line-height: 1.05;
					margin: 0 0 12px 0;
					background: linear-gradient(90deg, var(--accent-from), var(--accent-to));
					-webkit-background-clip: text;
					background-clip: text;
					color: transparent;
					letter-spacing: -0.5px;
				}

				.subtitle {
					color: rgba(230,238,248,0.85);
					margin: 0 0 20px 0;
					max-width: 64ch;
				}

				.ctas { display: flex; gap: 12px; flex-wrap: wrap }

				.btn {
					display: inline-block;
					padding: 12px 18px;
					border-radius: 10px;
					text-decoration: none;
					font-weight: 600;
					transition: transform .16s ease, box-shadow .16s ease;
				}

				.btn.primary {
					color: white;
					background: linear-gradient(90deg,var(--accent-from),var(--accent-to));
					box-shadow: 0 6px 24px rgba(12,18,50,0.45);
				}

				.btn.primary:hover { transform: translateY(-3px) }

				.btn.ghost {
					color: rgba(230,238,248,0.95);
					background: transparent;
					border: 1px solid rgba(255,255,255,0.08);
					backdrop-filter: blur(6px);
				}

				.visual { position: relative; height: 300px; display: flex; align-items:center; justify-content:center }
				.blob { width: 360px; height: 360px; filter: drop-shadow(0 20px 50px rgba(7,10,26,0.6)) }

				.features { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; margin-top: 28px }

				.card {
					background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
					border-radius: 12px;
					padding: 18px;
					box-shadow: 0 6px 22px rgba(6,7,15,0.5);
					border: 1px solid rgba(255,255,255,0.03);
				}

				.card h3 { margin: 0 0 8px 0; color: #dbeafe }
				.card p { margin: 0; color: rgba(220,230,245,0.9); font-size: 0.95rem }

				.footnote { grid-column: 1 / -1; margin-top: 18px; color: rgba(200,210,230,0.7); font-size: 0.95rem }

				@media (max-width: 900px) {
					.container { grid-template-columns: 1fr; padding: 0 8px }
					.visual { order: -1; margin-bottom: 8px }
					.features { grid-template-columns: 1fr; }
					.blob { width: 300px; height: 300px }
					.title { font-size: 1.8rem }
				}

			`}</style>
		</section>
	);
}
