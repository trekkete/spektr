# PCAP Parsing on ARM Mac (Apple Silicon)

## Issue

The PCAP parsing functionality uses Pcap4J, which requires native libpcap libraries. On ARM Macs (Apple Silicon), the native libraries are not compatible, resulting in:

```
java.lang.UnsatisfiedLinkError: ... (fat file, but missing compatible architecture (have 'i386,x86_64', need 'arm64e' or 'arm64'))
```

## Solutions for Local Development

### Option 1: Run Backend in Docker (Recommended)

Run the Spring Boot backend in an x86 Docker container:

```bash
# Build and run with Docker
docker build --platform linux/amd64 -t spektr-backend .
docker run --platform linux/amd64 -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/spektr_dev \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=your_password \
  spektr-backend
```

Frontend runs natively on your Mac:
```bash
cd frontend
npm start
```

### Option 2: Install ARM-compatible libpcap (May Work)

Try installing libpcap via Homebrew:

```bash
brew install libpcap
```

This may not work with Pcap4J as it expects specific library paths.

### Option 3: Develop Without PCAP Feature

The PCAP upload feature will show an error, but all other features work fine. You can test PCAP parsing:
- On the production x86 container
- Using unit tests that mock the parser
- By temporarily disabling the PCAP endpoint

## Production Deployment

In production (x86 containers), the PCAP parsing will work without issues. Make sure your Docker image includes libpcap:

```dockerfile
RUN apt-get update && \
    apt-get install -y libpcap0.8 libpcap-dev && \
    rm -rf /var/lib/apt/lists/*
```

## Testing

The unit tests in `PcapParserServiceTest` will also fail on ARM Macs. To skip them:

```bash
mvn test -Dtest='!PcapParserServiceTest'
```

Or run in Docker:

```bash
docker run --platform linux/amd64 -v $(pwd):/app -w /app maven:3.9-eclipse-temurin-17 \
  mvn test
```

## Error Handling

The application now gracefully handles the missing native libraries:
- Returns HTTP 503 (Service Unavailable) with a helpful error message
- Doesn't crash the application
- Other features continue to work normally
