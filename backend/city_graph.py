# backend/city_graph.py
import networkx as nx

G = nx.DiGraph()

# Define your intersections as nodes
# Replace with your actual city intersections
intersections = [
    "INT_01", "INT_02", "INT_03", "INT_04",
    "INT_05", "INT_06", "INT_07", "INT_08",
    "HOSPITAL_A", "HOSPITAL_B"
]
G.add_nodes_from(intersections)

# Define roads between intersections (distance in meters)
roads = [
    ("INT_01", "INT_02", 150),
    ("INT_02", "INT_03", 200),
    ("INT_03", "INT_04", 180),
    ("INT_04", "INT_05", 220),
    ("INT_05", "INT_06", 160),
    ("INT_06", "INT_07", 190),
    ("INT_07", "INT_08", 140),
    ("INT_08", "HOSPITAL_A", 300),
    ("INT_03", "HOSPITAL_B", 400),
    # Add reverse directions
    ("INT_02", "INT_01", 150),
    ("INT_03", "INT_02", 200),
    ("INT_04", "INT_03", 180),
    ("INT_05", "INT_04", 220),
    ("INT_06", "INT_05", 160),
    ("INT_07", "INT_06", 190),
    ("INT_08", "INT_07", 140),
    ("HOSPITAL_A", "INT_08", 300),
    ("HOSPITAL_B", "INT_03", 400),
]

for src, dst, dist in roads:
    G.add_edge(src, dst, weight=dist)


def get_shortest_path(start: str, end: str) -> list:
    """Returns list of intersections from start to end"""
    try:
        return nx.shortest_path(G, start, end, weight='weight')
    except nx.NetworkXNoPath:
        return []


def get_path_distances(path: list) -> list:
    """Returns distances between consecutive nodes in path"""
    distances = []
    for i in range(len(path) - 1):
        d = G[path[i]][path[i+1]]['weight']
        distances.append(d)
    return distances