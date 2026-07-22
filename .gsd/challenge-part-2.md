# Challenge Part 2: Optimization & Infrastructure

## Observability

Instrument the application to gain visibility into its runtime behavior.

### Objectives

- Collect application metrics.
- Capture distributed traces.
- Identify slow requests.
- Identify database queries with high response times.
- Provide dashboards or tools for analysis.

## Resilience & Quality

Based on data collected through observability, implement one or more improvements that increase the application's robustness and performance.

Choose at least one of the following options:

- Implement caching.
- Add rate limiting.
- Run load tests and present the results.
- Implement another infrastructure improvement.

## Kubernetes Deployment

Deploy the application to a Kubernetes cluster.

### Tool

- [kind](https://kind.sigs.k8s.io/) — Kubernetes in Docker for local cluster provisioning.

### Minimum Requirements

- Run the application with 2 replicas.
- Configure an Ingress or LoadBalancer.
- Enable Sticky Sessions to ensure a player remains connected to the same pod throughout an entire match.
