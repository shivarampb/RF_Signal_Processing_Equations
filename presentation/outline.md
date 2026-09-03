# RF Signal Processing: presentation outline

Generated from `src/content.js`. Edit that file and run `node src/build_outline.js`; the same file drives the slide deck.

Audience: mixed (RF experts and newcomers). Format: intuition first, equation second, then an *expert corner*. Duration: about 90 minutes including recaps and questions.

## Timing

| Part | Minutes | Slides |
|---|---:|---:|
| Opening | 5 | 3 |
| Part 1 · RF signal fundamentals | 15 | 8 |
| Part 2 · Sampling: continuous to discrete | 12 | 6 |
| Part 3 · Inside the ADC | 20 | 11 |
| Part 4 · DFT, FFT and IFFT | 25 | 10 |
| Part 5 · Putting it together | 13 | 6 |
| **Total** | **90** | **44** |

## Opening (5 min)

### Slide 1 · RF Signal Processing · 1 min

*From antenna to bits: the equations, the ADC, and the FFT*

**Speaker notes**

Welcome. This talk is for two groups at once: people who design RF systems every day, and people who have never seen a spectrum. Promise to both: beginners will leave able to read an ADC datasheet and an FFT plot; experts get the derivations and the design trade-offs in the "expert corner" boxes.

### Slide 2 · Agenda and what you will be able to do · 2 min

**Slide content**

- Part 1 · RF fundamentals: sine waves, dB, I/Q, noise, link budget (15 min)
- Part 2 · Sampling: turning a continuous wave into numbers (12 min)
- Part 3 · Inside the ADC: sample-and-hold, quantiser, SAR, flash, sigma-delta (20 min)
- Part 4 · DFT, FFT and IFFT: the equations and the butterfly (25 min)
- Part 5 · End-to-end worked example, OFDM, pitfalls (13 min)

**After this talk you can**

- Compute sample rate, resolution and SNR for a given ADC
- Explain what happens inside an ADC in each clock cycle
- Read an FFT: bins, resolution, leakage, noise floor
- Explain why the FFT is fast and how the IFFT is used in Wi-Fi and 5G

**Speaker notes**

Set expectations. Every topic goes intuition first, equation second, then an expert corner. Recap slides at the end of each part are where beginners should check they can follow. Total ≈ 90 minutes including questions. If running late, Part 5 pitfalls can be compressed.

### Slide 3 · The big picture: a receive chain · 2 min

**Slide content**

- Antenna converts an electromagnetic wave into a tiny voltage (microvolts)
- LNA amplifies it while adding as little noise as possible
- Mixer shifts the signal from RF (GHz) down to an IF or baseband (MHz)
- Filter removes everything outside the band of interest
- ADC converts the analog voltage into a stream of numbers
- DSP (FFT, filters, demodulation) turns numbers into information

**Speaker notes**

Beginner analogy: the chain is a translator. The antenna hears a whisper in a foreign language, the LNA turns up the volume, the mixer slows the speech down, the filter blocks the background chatter, the ADC writes it down as numbers, and the DSP reads the numbers. This diagram returns at the start of each part as a "you are here" marker. Experts: note the ADC is the boundary between analog and digital. Everything before it is a physics problem, everything after it is maths.

## Part 1 · RF signal fundamentals (15 min)

### Slide 4 · Part 1 · RF signal fundamentals

*Sine waves, decibels, I/Q, noise and the link budget*

**Speaker notes**

Section opener. You are here: antenna, LNA, mixer. Keep it brisk for the experts, but the I/Q slide is the one beginners must not miss.

### Slide 5 · What is an RF signal? · 3 min

**Equations**

- `x(t) = A · cos(2π f t + φ)`  
  Amplitude A, frequency f (Hz), phase φ (rad)
- `ω = 2π f        λ = c / f`  
  Angular frequency; wavelength (c ≈ 3 × 10⁸ m/s)

**Slide content**

- RF = radio frequency, roughly 3 kHz to 300 GHz; Wi-Fi at 2.4 GHz has λ ≈ 12.5 cm
- Information is carried by changing A, f or φ over time (modulation)
- One cycle takes T = 1/f seconds; at 2.4 GHz that is 417 picoseconds

> **Expert corner.** Real signals are bandpass: a carrier at fc with information spread over a bandwidth B ≪ fc. That separation of scales is what makes downconversion and complex baseband possible.

**Speaker notes**

Beginner: a sine wave is a spinning wheel seen from the side. A is the wheel radius, f is how many turns per second, φ is where the wheel started. Ask the room: how long is one cycle at 2.4 GHz? 417 ps. Light travels 12.5 cm in that time. That is why antennas are that size.

### Slide 6 · Decibels: the language of RF · 2 min

**Equations**

- `P(dBm) = 10 · log₁₀( P / 1 mW )`  
  Absolute power referenced to 1 milliwatt
- `G(dB) = 10 · log₁₀( P_out / P_in )
         = 20 · log₁₀( V_out / V_in )`  
  Gain: power ratio, or voltage ratio into equal impedance

| Power | dBm | Where you see it |
|---|---|---|
| 1 W | +30 dBm | Mobile phone max transmit |
| 1 mW | 0 dBm | Reference |
| 1 µW | −30 dBm | Strong Wi-Fi signal |
| 1 pW | −90 dBm | Weak Wi-Fi signal |
| 0.1 fW | −130 dBm | GPS at the antenna |

**Speaker notes**

Beginner: dB turns multiplication into addition. A chain of gains and losses becomes a sum. Memorise three numbers: ×2 = +3 dB, ×10 = +10 dB, ×1000 = +30 dB. Expert aside: the 20 log form for voltage assumes equal source and load impedance; mixing 10 log and 20 log is the most common dB mistake in link budgets.

### Slide 7 · Modulation in one equation · 2 min

**Equations**

- `x(t) = A(t) · cos(2π f_c t + φ(t))`  
  AM changes A(t); PM changes φ(t); FM changes dφ/dt
- `x(t) = I(t) · cos(ω_c t) − Q(t) · sin(ω_c t)`  
  Any modulation as two amplitude-modulated carriers 90° apart

**Slide content**

- I = in-phase component, Q = quadrature component
- A(t) = √(I² + Q²)   and   φ(t) = atan2(Q, I)
- Digital modulation (QPSK, 16-QAM, OFDM) is just choosing (I, Q) points from a constellation

> **Expert corner.** The I/Q form is the trigonometric expansion of A·cos(ωt + φ) with I = A cos φ and Q = A sin φ. Every modern transceiver implements exactly this equation in hardware: two DACs, two mixers, one 90° phase shifter.

**Speaker notes**

Beginner: to send information you wiggle something about the wave. AM wiggles height, FM wiggles speed, PM wiggles the start position. The second equation is the most important one in the talk for understanding transceivers: any wiggle at all can be produced by mixing two slowly varying signals I and Q with a cosine and a sine.

### Slide 8 · I/Q and the complex baseband · 3 min

**Equations**

- `x(t) = Re{ (I(t) + jQ(t)) · e^{ jω_c t } }`  
  Complex envelope s(t) = I + jQ spins at ω_c
- `e^{jθ} = cos θ + j sin θ`  
  Euler: a complex exponential is a cosine and a sine sharing one phase

**Slide content**

- Mixing with cos and −sin and low-pass filtering recovers I and Q from the RF signal
- Complex baseband s(t) has bandwidth B, centred at 0 Hz, instead of at fc
- This is why the ADC samples at ~B (or 2B for I and Q), not at 2 × fc

> **Expert corner.** Negative frequencies are real in complex baseband: an offset of −1 MHz from fc is a distinct signal from +1 MHz. Image rejection depends on I/Q gain and phase balance: IRR ≈ −10 log₁₀((ε² + Δφ²)/4).

*Chart:* Left: RF tone at fc. Right: after I/Q mixing the same information sits at baseband, at a frequency the ADC can handle.

**Speaker notes**

Beginner: instead of recording a 2.4 GHz wave, we record how the wave differs from a perfect 2.4 GHz reference. Those differences change slowly, so they are easy to digitise. I and Q are the two numbers that capture the difference. Chart: the left spectrum is the RF signal at fc = 20 (arbitrary units). The right spectrum is the complex baseband spectrum after mixing: the energy moved to near 0. The ADC only has to be as fast as the bandwidth of the message, not the carrier.

### Slide 9 · Noise: the floor under every signal · 3 min

**Equations**

- `N = k · T · B      →   −174 dBm/Hz at 290 K`  
  Thermal noise power; k = 1.38 × 10⁻²³ J/K
- `SNR = P_signal / P_noise
NF = SNR_in / SNR_out`  
  Signal-to-noise ratio; noise figure of a stage (dB)
- `F_total = F₁ + (F₂ − 1)/G₁ + (F₃ − 1)/(G₁G₂) + …`  
  Friis cascade: the first stage dominates

**Slide content**

- A 20 MHz Wi-Fi channel has a thermal noise floor of −174 + 73 = −101 dBm
- Every stage adds noise; the LNA goes first so its gain shrinks everyone else's contribution

> **Expert corner.** Friis uses linear ratios, not dB. A 3 dB NF LNA with 20 dB gain in front of a 10 dB NF mixer gives F = 2 + (10 − 1)/100 = 2.09 → 3.2 dB. Swap the order and NF jumps to nearly 10 dB.

**Speaker notes**

Beginner: every resistor at room temperature hisses. The hiss power per Hz is fixed at −174 dBm/Hz, so a wider channel collects more hiss. The receiver must keep the signal above that hiss. Friis is why the LNA sits right at the antenna. Do the worked example on the slide with the room.

### Slide 10 · Link budget: will the signal arrive? · 2 min

**Equations**

- `P_rx = P_tx + G_tx + G_rx
− FSPL − L_misc`  
  All terms in dB / dBm
- `FSPL(dB) = 20 log₁₀(d_km)
    + 20 log₁₀(f_MHz) + 32.44`  
  Free-space path loss

| Term | Value | Note |
|---|---|---|
| P_tx | +20 dBm | Wi-Fi access point |
| G_tx + G_rx | +2 + 2 dBi | Small antennas |
| FSPL at 50 m, 2.4 GHz | −74 dB | 20log(0.05) + 20log(2400) + 32.44 |
| P_rx | −50 dBm | Comfortably above −101 dBm floor |
| SNR | ≈ 51 dB | Before implementation losses |

**Speaker notes**

Beginner: shout loudness minus distance loss plus how good the ears are equals what you hear. Do the arithmetic on the slide out loud. Expert aside: FSPL grows 6 dB per doubling of distance and 6 dB per doubling of frequency, which is why mmWave 5G needs beamforming gain to close the same link.

### Slide 11 · Recap · Part 1 · 1 min

**Slide content**

- A cos(2π f t + φ): everything in RF is built from this
- dB adds instead of multiplies; dBm is absolute power vs 1 mW
- Any modulation = I cos(ωt) − Q sin(ωt); complex baseband I + jQ
- Thermal noise −174 dBm/Hz; Friis says put the LNA first
- Link budget: P_rx = P_tx + gains − path loss

**Speaker notes**

Pause for questions from the beginner side of the room. Check: can everyone say what I and Q are in one sentence?

## Part 2 · Sampling: continuous to discrete (12 min)

### Slide 12 · Part 2 · Sampling

*Turning a continuous wave into a list of numbers*

**Speaker notes**

You are here: the filter and the entrance to the ADC. This part explains why the filter must come before the ADC.

### Slide 13 · Sampling: x(t) becomes x[n] · 3 min

**Equations**

- `x[n] = x(n · T_s)        f_s = 1 / T_s`  
  Read the voltage every T_s seconds; f_s is the sample rate

**Slide content**

- Continuous time t (seconds) becomes an integer index n
- Between samples the ADC knows nothing; the theory says that is fine if f_s is high enough
- Chart: a 1 kHz sine sampled at 12 kSPS; the dots are all the digital world ever sees

> **Expert corner.** Mathematically sampling multiplies x(t) by an impulse train; in frequency this convolves X(f) with impulses at multiples of f_s, creating periodic copies. Aliasing is those copies overlapping.

**Speaker notes**

Beginner: a movie camera takes 24 pictures per second and your brain fills in the motion. Sampling is the same: snapshots of the voltage at regular intervals. The chart shows the continuous wave (line) and the samples (dots). The digital system only ever receives the dots.

### Slide 14 · Nyquist–Shannon: how fast is fast enough? · 4 min

**Equations**

- `f_s > 2 · f_max`  
  Sample faster than twice the highest frequency present
- `f_alias = | f − k · f_s |
k = nearest integer`  
  A tone above f_s/2 shows up at a wrong, lower frequency

**Slide content**

- Chart: a 9 kHz tone sampled at 8 kSPS produces exactly the same samples as a 1 kHz tone
- Once aliased, the damage is permanent: no algorithm can tell the two apart

> **Expert corner.** Aliasing folds the spectrum about f_s/2 like a sheet of paper. Wagon wheels in films rotating backwards are aliasing at 24 frames per second.

**Speaker notes**

This is the key slide of Part 2. Walk through the chart: the coral 9 kHz wave and the teal 1 kHz wave pass through identical sample points. The ADC output is the same list of numbers, so the DSP has no way to know which wave was really there. Beginner: if you only glance at a clock once every 11 hours you will think it runs backwards.

### Slide 15 · Anti-alias filter: before the ADC, always · 2 min

**Equations**

- `Bandpass sampling:
2 f_H / n  ≤  f_s  ≤  2 f_L / (n − 1)`  
  Sample a band [f_L, f_H] below 2 f_H if it stays clear of the fold points

**Slide content**

- Rule: remove everything above f_s/2 in analog, before sampling
- Practical filters have a transition band, so f_s is chosen 2.2 to 2.5 × the signal bandwidth
- Oversampling (f_s ≫ 2B) relaxes the analog filter and lets a digital filter finish the job

> **Expert corner.** Undersampling an IF (for example a 70 MHz IF at 61.44 MSPS) deliberately aliases the band down to baseband. It works only with a good bandpass filter and a low-jitter clock, because jitter noise scales with the analog input frequency, not with f_s.

**Speaker notes**

Beginner: the filter is a bouncer at the door of the ADC. Anything above half the sample rate gets turned away because once inside it cannot be removed. Expert corner: bandpass sampling is how many receivers digitise an IF directly. Mention that the jitter requirement is set by f_in, which we will quantify in Part 3.

### Slide 16 · Reconstruction: getting x(t) back from x[n] · 2 min

**Equations**

- `x(t) = Σₙ x[n] · sinc( (t − n T_s) / T_s )`  
  Whittaker–Shannon interpolation; sinc(u) = sin(πu)/(πu)

**Slide content**

- Each sample launches a sinc pulse; the sum passes exactly through every sample and is smooth in between
- In hardware: the DAC outputs a staircase, and a reconstruction (low-pass) filter smooths it
- The staircase costs sinc(f/f_s) droop: −3.9 dB at f_s/2, often pre-compensated digitally

**Speaker notes**

Beginner: a low-pass filter is a very good guesser. Given the dots, it draws the only smooth curve that could have produced them, as long as the Nyquist rule held. Expert aside: the sinc kernel is the ideal low-pass filter impulse response; the sum is a convolution of the sample train with that kernel.

### Slide 17 · Recap · Part 2 · 1 min

**Slide content**

- x[n] = x(nT_s); the digital world only sees the dots
- f_s > 2 f_max, or tones fold to f_alias = |f − k f_s| and the damage is permanent
- Anti-alias filter goes before the ADC; oversampling relaxes it
- Reconstruction: sum of sincs, or DAC staircase + low-pass filter

**Speaker notes**

Quick check with the room: if I sample at 100 MSPS, what is the highest frequency I can represent? 50 MHz. And a 60 MHz tone appears at? 40 MHz.

## Part 3 · Inside the ADC (20 min)

### Slide 18 · Part 3 · Inside the ADC

*What happens in each clock cycle between a voltage and a number*

**Speaker notes**

You are here: the ADC. This is the longest hands-on part. Beginners: three ideas only: hold the voltage, compare it, write down the code.

### Slide 19 · An ADC in one picture · 2 min

**Slide content**

- 1 · Sample-and-hold freezes the input voltage for one conversion
- 2 · Quantiser decides which of 2ᴺ levels the frozen voltage is closest to
- 3 · Encoder outputs the level as an N-bit binary code
- A clock at f_s repeats this every T_s; the output is a stream of N-bit words

**Speaker notes**

Beginner: take a photo (hold), measure it against a ruler with 2^N marks (quantise), write the mark number down (encode). Every ADC architecture is a different way of doing step 2 quickly, accurately or cheaply.

### Slide 20 · Sample-and-hold: freezing a moving target · 3 min

**Equations**

- `SNR_jitter =
−20 · log₁₀( 2π · f_in · t_j )`  
  Best possible SNR when the sampling instant wobbles by t_j (rms)

**Slide content**

- Track phase: switch closed, capacitor follows the input (needs acquisition time)
- Hold phase: switch opens; capacitor voltage is constant while the quantiser works
- Aperture jitter t_j: the switch opens slightly early or late, sampling a slightly wrong voltage
- Chart: a 100 MHz input with 1 ps rms jitter is limited to 64 dB no matter how many bits the ADC has

> **Expert corner.** Slope error ΔV = (dV/dt) · t_j; for a full-scale sine dV/dt peaks at 2π f A, hence the formula. At a 1 GHz input, 12-bit performance needs about 100 fs rms jitter.

**Speaker notes**

Beginner: photographing a running athlete; if the shutter fires a little late you capture a different position. The faster the athlete (higher f_in), the bigger the error for the same timing slip. Walk through the chart: three lines for 100 fs, 1 ps, 10 ps. Point out that the lines are straight on log axes and fall 20 dB per decade of input frequency.

### Slide 21 · Quantisation: the ruler with 2ᴺ marks · 3 min

**Equations**

- `LSB = V_FS / 2ᴺ`  
  Step size; 12-bit, 2 V full scale → 488 µV
- `code = round( V_in / LSB )`  
  Nearest level (mid-tread quantiser)

**Slide content**

- Chart: a 3-bit quantiser (8 levels) turning a ramp into a staircase
- Each extra bit halves the step and doubles the number of levels
- The difference between the ramp and the staircase is the quantisation error

**Speaker notes**

Beginner: measuring height with a ruler marked only in whole centimetres. You always round to the nearest mark; the rounding is the error. Note the staircase is drawn as a dense line chart so it stays a native, editable PowerPoint chart.

### Slide 22 · Quantisation error behaves like noise · 2 min

**Equations**

- `e = V_in − V_q
−LSB/2 ≤ e < +LSB/2`  
  Error is a sawtooth versus input
- `σ²_e = LSB² / 12        σ_e = LSB / √12`  
  Variance of a uniform distribution of width LSB

**Slide content**

- Left chart: error against input voltage is a sawtooth
- Right chart: histogram of the error is flat (uniform) between ±LSB/2
- For a busy signal the error looks like white noise, so we treat it as a noise power of LSB²/12

> **Expert corner.** The uniform, white assumption fails for small or periodic inputs, where the error becomes a deterministic harmonic pattern (spurs). Dither (adding a little noise before the quantiser) randomises the error and restores the model.

**Speaker notes**

Beginner: rounding errors are sometimes positive, sometimes negative, all equally likely. Adding many equally likely small errors looks exactly like hiss. The variance formula is the integral of e² over the uniform density 1/LSB from −LSB/2 to +LSB/2. Experts: mention dither briefly.

### Slide 23 · The famous 6.02 N + 1.76 dB · 3 min

**Equations**

- `P_signal = (V_FS / 2)² / 2 = V_FS² / 8
P_noise = LSB² / 12 = V_FS² / (12 · 2²ᴺ)`  
  Full-scale sine power over quantisation noise power
- `SNR = 10 log₁₀( 1.5 · 2²ᴺ ) = 6.02 N + 1.76 dB`  
  Because 10 log₁₀(1.5) = 1.76 and 20 log₁₀(2) = 6.02
- `ENOB = ( SINAD − 1.76 ) / 6.02`  
  Effective number of bits from the measured signal-to-noise-and-distortion

**Slide content**

- Chart: ideal SNR vs bits; 8-bit 50 dB, 12-bit 74 dB, 16-bit 98 dB
- Real ADCs fall short: a "14-bit" part with SINAD 72 dB has ENOB 11.7

**Speaker notes**

Derive it live. Signal: full-scale sine amplitude V_FS/2, power amplitude²/2. Noise: LSB²/12 with LSB = V_FS/2^N. Divide, take 10 log. Beginner take-away: every bit buys 6 dB. Expert take-away: datasheets quote SINAD and SFDR at specific input frequencies; ENOB drops as f_in rises because of jitter and distortion.

### Slide 24 · Flash ADC: all comparisons at once · 2 min

**Slide content**

- A resistor ladder generates 2ᴺ − 1 reference voltages
- 2ᴺ − 1 comparators each answer "is V_in above my reference?" in parallel
- Result is a thermometer code (1111000) converted to binary (100) by logic
- One clock cycle per conversion: the fastest architecture, GSPS speeds
- Cost: 8 bits = 255 comparators; 12 bits = 4095. Power and area explode

> **Expert corner.** Comparator offset must be below LSB/2, which is why practical flash converters stop at 6 to 8 bits. Interpolating and folding architectures reduce the comparator count; time-interleaving many slower ADCs is the other route to GSPS.

**Speaker notes**

Beginner: instead of one ruler, hire 255 people each holding one mark and ask them all at once "is it above you?" Fast, but expensive. Diagram: ladder on the left, comparators in the middle, encoder on the right.

### Slide 25 · SAR ADC: binary search, one bit per clock · 3 min

**Slide content**

- One comparator, one DAC, N clock cycles per conversion
- Cycle 1: try MSB (½ V_ref). Above? keep the bit. Below? clear it
- Cycle 2: try the next bit (¼ V_ref added). Repeat until the LSB
- Chart: 8-bit SAR converging on V_in = 0.70 V_ref → code 179 = 10110011
- Pipeline ADCs: several coarse stages in series, each passing its residue on; high speed and resolution at the cost of latency

> **Expert corner.** Modern SAR ADCs use a binary-weighted capacitor DAC with charge redistribution; the sampling capacitor is the DAC, so there is no separate sample-and-hold. Asynchronous SAR and time-interleaving push SAR past 1 GSPS at 10 to 12 bits.

**Speaker notes**

Beginner: guessing a number between 0 and 255 with "higher or lower" answers. Eight questions always suffice. Chart walk-through: each dot is the DAC trial voltage; where the trial is below V_in the bit is kept and the line stays; where it overshoots the bit is dropped and the line falls back.

### Slide 26 · Sigma-delta ADC: trade speed for resolution · 2 min

**Equations**

- `OSR = f_s / (2 B)`  
  Oversampling ratio
- `SNR gain = 10 log₁₀(OSR)
→ +3 dB per doubling of OSR (no shaping)`  
  Noise power spreads over a wider band; the digital filter keeps only B
- `1st-order noise shaping: +9 dB per doubling
L-th order: (6L + 3) dB per doubling`  
  The modulator pushes quantisation noise to high frequencies

**Slide content**

- A 1-bit quantiser running at MHz rates plus a digital decimation filter yields 16 to 24 bits at kHz to MHz bandwidths
- Used in audio, precision measurement, and many cellular baseband receivers

**Speaker notes**

Beginner: instead of one careful measurement, make thousands of crude yes/no measurements very fast and average them. Noise shaping is the trick of making the crude errors mostly happen at frequencies you are going to throw away anyway. Expert aside: the noise transfer function of a first-order loop is (1 − z⁻¹); integrated in-band noise falls 9 dB per octave of OSR.

### Slide 27 · Reading an ADC datasheet · 2 min

| Term | Meaning | Why it matters |
|---|---|---|
| DNL | Actual step width − 1 LSB | DNL < −1 LSB means a missing code |
| INL | Deviation of the transfer curve from a straight line | Sets distortion / harmonic spurs |
| SNR | Signal to noise (no harmonics) | Thermal + quantisation + jitter |
| SFDR | Signal to largest spur | Limits weak signal next to a strong one |
| SINAD / ENOB | Signal to noise + distortion | The honest resolution at that f_in |

| Architecture | Speed | Resolution | Latency | Typical use |
|---|---|---|---|---|
| Flash | GSPS | 4–8 bit | 1 cycle | Oscilloscopes, SerDes |
| SAR | kSPS–100s MSPS | 8–18 bit | N cycles | Sensors, SDR, control |
| Pipeline | 10s MSPS–GSPS | 10–16 bit | Several cycles | Radio IF sampling, video |
| Sigma-delta | kSPS–10s MSPS | 16–24 bit | Long (filter) | Audio, instrumentation |

**Speaker notes**

Give beginners the three numbers to look up first: sample rate, ENOB at their input frequency, and SFDR. Experts: the comparison table is a starting point; mention that architectures blend (pipelined SAR, continuous-time sigma-delta at 100s of MHz).

### Slide 28 · Recap · Part 3 · 1 min

**Slide content**

- Hold, quantise, encode; a clock repeats it f_s times per second
- LSB = V_FS / 2ᴺ; error is uniform, power LSB²/12
- SNR = 6.02 N + 1.76 dB; ENOB from measured SINAD
- Jitter limit: SNR = −20 log(2π f_in t_j), set by input frequency
- Flash: parallel and fast. SAR: binary search, N cycles. Sigma-delta: oversample and shape noise

**Speaker notes**

Check with the room: a 10-bit ADC has ideal SNR of? 62 dB. To digitise a 200 MHz IF with 12-bit performance, roughly what jitter? A few hundred femtoseconds.

## Part 4 · DFT, FFT and IFFT (25 min)

### Slide 29 · Part 4 · DFT, FFT and IFFT

*From a list of numbers to a spectrum, and back*

**Speaker notes**

You are here: the DSP block. Beginners: the DFT is a set of correlations. The FFT is only a faster way to compute the same thing. The IFFT goes back.

### Slide 30 · Why the frequency domain? · 3 min

**Slide content**

- Left: 256 samples of two tones plus noise; in time it is a mess
- Right: the same data after an FFT; two clean peaks, noise floor far below
- Filtering, channel selection, modulation and spectrum measurement are all simpler in frequency

> **Expert corner.** The FFT concentrates a tone into one bin while spreading white noise over N bins: the processing gain is 10 log₁₀(N/2), about 21 dB for N = 256. That is why the peaks stand so far above the floor.

**Speaker notes**

Beginner: a chord played on a piano is one messy pressure wave in time, but three clear notes in frequency. The FFT is the ear that hears the notes. Ask: how many tones? Where? Then reveal the right chart.

### Slide 31 · Fourier series → Fourier transform → DFT · 2 min

**Equations**

- `Fourier series (periodic x):   c_k = (1/T) ∫₀ᵀ x(t) e^{−j2πkt/T} dt`  
  Discrete harmonics of a periodic continuous signal
- `Fourier transform (any x):   X(f) = ∫ x(t) e^{−j2πft} dt`  
  Continuous spectrum of a continuous signal
- `DFT (N samples):   X[k] = Σₙ₌₀ᴺ⁻¹ x[n] e^{−j2πkn/N}`  
  Discrete spectrum of a discrete, finite signal: the one a computer can run

**Speaker notes**

Beginner: same idea three times. Multiply the signal by a spinning reference and add up; the total is how much of that spin the signal contains. The DFT is the version that works on a list of numbers. Expert aside: the DFT implicitly assumes x[n] is periodic with period N; that assumption is where leakage comes from later.

### Slide 32 · The DFT: what k, n and N mean · 3 min

**Equations**

- `X[k] = Σₙ₌₀ᴺ⁻¹ x[n] · e^{−j2πkn/N}
k = 0 … N−1`  
  N inputs in, N complex outputs out
- `f_k = k · f_s / N        Δf = f_s / N`  
  Bin k sits at frequency f_k; bin spacing is the resolution

**Slide content**

- x[n]: the n-th sample. X[k]: how much of frequency f_k is present, as amplitude and phase
- |X[k]| is the magnitude spectrum; ∠X[k] is the phase spectrum
- For real x[n], bins above N/2 mirror those below: only N/2 + 1 are unique
- Example: f_s = 40 MSPS, N = 1024 → Δf = 39.06 kHz; a 10 MHz tone lands in bin 256

> **Expert corner.** Resolution Δf depends on record length N·T_s = N/f_s only. Zero-padding interpolates the plot but does not improve resolution; only a longer record does.

**Speaker notes**

Beginner: X[k] is the answer to the question "how much does my signal look like a wave of frequency f_k?" asked for N different frequencies. Do the example arithmetic: 40e6/1024 = 39062.5 Hz; 10e6/39062.5 = 256. That number returns in Part 5.

### Slide 33 · The DFT is correlation with sinusoids · 3 min

**Equations**

- `W_N = e^{−j2π/N}
X[k] = Σₙ x[n] · W_N^{kn}`  
  Twiddle factor: one step around the unit circle
- `e^{−j2πkn/N} =
cos(2πkn/N) − j sin(2πkn/N)`  
  Each bin correlates with one cosine (real part) and one sine (imaginary part)

**Slide content**

- Chart: the cosine basis functions for k = 1, 2, 3 with N = 32; k counts whole cycles across the record
- Multiply the signal by each basis, sum the products: a big sum means that frequency is present
- The bases are orthogonal, so each bin measures its own frequency without interference

> **Expert corner.** Orthogonality: Σₙ W_N^{(k−m)n} = N·δ[k−m]. This is the geometric series identity and the reason the inverse transform needs only a 1/N scale factor.

**Speaker notes**

Beginner: to check whether a song contains a particular note, hum that note alongside it and listen for beats. The DFT hums N notes in turn and reports how strongly each one resonates. Chart: point out that k = 1 fits one cycle in the record, k = 2 fits two, k = 3 fits three.

### Slide 34 · The FFT: same answer, far fewer operations · 4 min

**Equations**

- `X[k] = E[k] + W_N^k · O[k]
X[k + N/2] = E[k] − W_N^k · O[k]`  
  Decimation in time: E = DFT of even samples, O = DFT of odd samples (each size N/2)
- `Direct DFT: N² multiplies
Radix-2 FFT: (N/2) · log₂N butterflies`  
  Cooley–Tukey, 1965 (Gauss, 1805)

**Slide content**

- Splitting into even and odd halves the work; do it recursively log₂N times
- The butterfly (right) is the whole algorithm: two inputs, one twiddle multiply, two outputs
- Chart: for N = 1024 the FFT needs 5,120 butterflies instead of 1,048,576 multiplies, a 200× saving

> **Expert corner.** Radix-4 and split-radix reduce multiplies further; real-input FFTs halve the work again by packing two real signals into one complex FFT. Fixed-point implementations need scaling at each stage to avoid overflow (bit growth of 1 bit per stage).

**Speaker notes**

Beginner: the DFT does a lot of repeated multiplications. The FFT notices that the twiddle factors repeat and shares the work. Nothing is approximated: the FFT gives the exact DFT. Butterfly: a is added to b·W to make the top output, and subtracted to make the bottom output. That symmetry is the whole saving.

### Slide 35 · 8-point FFT, step by step · 3 min

**Slide content**

- Stage 0: reorder inputs in bit-reversed order (x[0], x[4], x[2], x[6], x[1], x[5], x[3], x[7])
- Stage 1: four 2-point butterflies (twiddle W₂⁰ = 1)
- Stage 2: two 4-point combines using W₄⁰, W₄¹
- Stage 3: one 8-point combine using W₈⁰ … W₈³; outputs X[0] … X[7] emerge in natural order
- 3 stages × 4 butterflies = 12 butterflies, versus 64 multiplies for the direct DFT

**Speaker notes**

Walk the diagram left to right. Emphasise bit reversal: index 1 = 001 becomes 100 = 4, which is why x[4] sits in the second slot. Expert aside: decimation-in-frequency does the mirror image (natural-order in, bit-reversed out). Hardware FFTs often pipeline one stage per clock.

### Slide 36 · Windowing and spectral leakage · 3 min

**Equations**

- `Hann:   w[n] = 0.5 · ( 1 − cos(2πn/N) )`  
  Multiply x[n] by w[n] before the FFT

**Slide content**

- The DFT assumes the record repeats forever; a tone that does not complete whole cycles has a jump at the seam
- That jump smears energy across all bins: leakage (coral trace, rectangular window)
- A window tapers the record ends to zero, so the seam disappears (teal trace, Hann window)
- Cost: wider main lobe (2 bins vs 1) and scalloping loss; gain: sidelobes drop from −13 dB to −31 dB

> **Expert corner.** Choose the window for the job: Hann for general use, flat-top for amplitude accuracy (< 0.01 dB scalloping), Blackman–Harris for dynamic range (−92 dB sidelobes), Kaiser when you want a tunable trade-off. Coherent gain and equivalent noise bandwidth must be corrected when reading absolute levels.

**Speaker notes**

Beginner: imagine cutting a piece from a wallpaper roll and gluing the ends together; if the pattern does not line up you get an ugly seam. The window fades the pattern out at the ends so no seam shows. Chart: a tone placed at bin 20.5, exactly between bins, the worst case. Compare the skirts.

### Slide 37 · IFFT: from spectrum back to samples · 3 min

**Equations**

- `x[n] = (1/N) · Σₖ₌₀ᴺ⁻¹ X[k] · e^{+j2πkn/N}`  
  Same structure as the DFT: sign flipped, scaled by 1/N
- `IFFT(X) = conj( FFT( conj(X) ) ) / N`  
  One FFT engine serves both directions

**Slide content**

- Chart: 64 samples of a signal and its IFFT(FFT(x)) reconstruction lie exactly on top of each other
- Round-trip error is at the floating-point limit (≈ 10⁻¹⁶); the pair is lossless
- Modify X[k] in between (zero some bins) and you have built a filter

> **Expert corner.** Fast convolution: y = IFFT(FFT(x) · FFT(h)) is circular convolution; overlap-add or overlap-save with zero padding makes it linear. It beats direct convolution for filter lengths above roughly 64 taps.

**Speaker notes**

Beginner: if the FFT is a recipe telling you how much of each ingredient is in the cake, the IFFT bakes the cake back from the recipe. Nothing is lost either way. Stat callout: the measured round-trip error from our own build script is shown on the slide.

### Slide 38 · Recap · Part 4 · 1 min

**Slide content**

- DFT: X[k] = Σ x[n] e^{−j2πkn/N}; bin k is at k·f_s/N; resolution f_s/N
- Each bin is a correlation with a cosine and a sine of frequency f_k
- FFT = the same DFT computed with (N/2) log₂N butterflies instead of N² multiplies
- Window before you transform; leakage comes from the seam
- IFFT: flip the sign, divide by N; FFT and IFFT are a lossless pair

**Speaker notes**

Check: 2048-point FFT at 100 MSPS, what is the bin spacing? 48.8 kHz. Which bin holds 25 MHz? 512.

## Part 5 · Putting it together (13 min)

### Slide 39 · Part 5 · Putting it together

*One worked example, where the FFT lives in real systems, and the classic mistakes*

**Speaker notes**

You are here: the whole chain. The worked example uses only equations already shown.

### Slide 40 · Worked example: 2.4 GHz tone to an FFT bin · 4 min

**Equations**

- `FFT noise floor (dBFS) =
−(6.02 N_bits + 1.76)
− 10 log₁₀(N/2)`  
  Processing gain: quantisation noise spreads across N/2 bins

**Worked steps**

1. **RF input** · f_RF = 2.400 GHz, P = −60 dBm at the ADC after LNA and mixer gain
2. **Downconvert** · LO = 2.390 GHz → IF = 10 MHz; anti-alias filter passes 5–15 MHz
3. **Sample** · f_s = 40 MSPS (> 2 × 15 MHz), 12-bit: ideal SNR = 74 dB
4. **FFT** · N = 1024 → Δf = 40e6 / 1024 = 39.06 kHz; bin = 10e6 / 39.06e3 = 256
5. **Noise floor** · FFT floor = −74 − 10 log₁₀(1024/2) = −74 − 27 = −101 dBFS
6. **Result** · Peak in bin 256, 101 dB above the FFT noise floor (ideal, no jitter)

**Speaker notes**

Go through each row slowly; this is the slide beginners should be able to reproduce afterwards. Expert aside: with 1 ps jitter at 10 MHz IF the jitter limit is 84 dB, still above the 74 dB quantisation limit, so the 12 bits are usable. Move the IF to 200 MHz and jitter (58 dB) dominates.

### Slide 41 · Where the FFT lives: OFDM in Wi-Fi, LTE and 5G · 3 min

**Slide content**

- Transmitter: place QPSK / QAM symbols on N subcarriers, IFFT → one time-domain symbol, add cyclic prefix
- Receiver: remove prefix, FFT → the subcarriers come straight back (chart: recovered = transmitted)
- Subcarriers are orthogonal DFT bins, so they can overlap in frequency without interfering
- Wi-Fi 802.11a/g: N = 64, 52 used, 312.5 kHz spacing, 20 MHz channel. 5G NR: up to 4096-point FFT
- Also: spectrum analysers, radar range-Doppler maps, audio codecs, image compression

> **Expert corner.** The cyclic prefix turns the channel's linear convolution into a circular one, so a multipath channel becomes a single complex gain per subcarrier: one-tap equalisation. That is the entire reason OFDM won.

**Speaker notes**

Beginner: OFDM sends many slow messages side by side instead of one fast one. The IFFT is the machine that packs them into one waveform and the FFT unpacks them. Chart: the recovered symbol constellation from our own IFFT then FFT is exact; the middle chart is the resulting time-domain waveform.

### Slide 42 · Five classic mistakes · 3 min

1. **No anti-alias filter** · Out-of-band tones fold into the band and look like real signals. Cannot be fixed later.
2. **Clipping the ADC** · Input above full scale creates harmonics across the whole spectrum. Leave 6 to 10 dB headroom.
3. **Forgetting to window** · A strong tone's leakage skirts bury weak neighbours. Use Hann or better.
4. **Wrong bin arithmetic** · Mixing up f_s/N with f_s/(2N), or bin index with frequency. Always write Δf = f_s/N first.
5. **Ignoring jitter at high IF** · A great 14-bit ADC becomes a 9-bit ADC at 500 MHz with a noisy clock.

**Speaker notes**

Each of these has appeared in a real design review. Invite the experts in the room to add their own.

### Slide 43 · Summary · the equation sheet · 2 min

|   |   |
|---|---|
| Signal | x(t) = A cos(2πft + φ) = I cos ωt − Q sin ωt |
| Power | P(dBm) = 10 log₁₀(P / 1 mW);  N = kTB = −174 dBm/Hz |
| Sampling | x[n] = x(nT_s);  f_s > 2 f_max;  f_alias = |f − k f_s| |
| Quantiser | LSB = V_FS / 2ᴺ;  σ² = LSB²/12 |
| ADC SNR | SNR = 6.02 N + 1.76 dB;  ENOB = (SINAD − 1.76)/6.02 |
| Jitter | SNR_j = −20 log₁₀(2π f_in t_j) |
| DFT | X[k] = Σ x[n] e^{−j2πkn/N};  f_k = k f_s/N;  Δf = f_s/N |
| FFT | X[k] = E[k] + W^k O[k];  cost (N/2) log₂N vs N² |
| IFFT | x[n] = (1/N) Σ X[k] e^{+j2πkn/N} |
| FFT floor | −(6.02N + 1.76) − 10 log₁₀(N/2) dBFS |

**Speaker notes**

Leave this slide up during questions. It is the one slide to photograph.

### Slide 44 · Questions? · 1 min

**References**

- A. V. Oppenheim, R. W. Schafer, Discrete-Time Signal Processing, 3rd ed.
- R. G. Lyons, Understanding Digital Signal Processing, 3rd ed.
- W. Kester (ed.), The Data Conversion Handbook, Analog Devices
- B. Razavi, RF Microelectronics, 2nd ed.
- J. W. Cooley, J. W. Tukey, "An algorithm for the machine calculation of complex Fourier series", 1965

**Speaker notes**

Thank the room. Point beginners to Lyons first; experts to Kester for ADC detail.
