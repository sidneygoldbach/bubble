#!/usr/bin/env python3
"""
Script para sincronizar ranking entre localStorage e arquivo JSON do servidor.
Este script deve ser executado periodicamente para manter o ranking global atualizado.
"""

import json
import os
from datetime import datetime

def load_ranking_from_file():
    """Carrega ranking do arquivo JSON."""
    try:
        with open('ranking.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_ranking_to_file(ranking):
    """Salva ranking no arquivo JSON."""
    with open('ranking.json', 'w', encoding='utf-8') as f:
        json.dump(ranking, f, ensure_ascii=False, indent=2)

def merge_rankings(server_ranking, new_entries):
    """Mescla rankings removendo duplicatas e ordenando por pontuação."""
    # Combinar todas as entradas
    all_entries = server_ranking + new_entries
    
    # Remover duplicatas baseadas em nome, pontuação e data
    unique_entries = []
    seen = set()
    
    for entry in all_entries:
        key = (entry['name'], entry['score'], entry['date'])
        if key not in seen:
            seen.add(key)
            unique_entries.append(entry)
    
    # Ordenar por pontuação (maior para menor)
    unique_entries.sort(key=lambda x: x['score'], reverse=True)
    
    return unique_entries

def add_sample_data():
    """Adiciona dados de exemplo para teste."""
    sample_entries = [
        {
            "name": "Bolheiro123",
            "score": 15420,
            "level": 8,
            "date": datetime.now().isoformat()
        },
        {
            "name": "Ninja456",
            "score": 12350,
            "level": 6,
            "date": datetime.now().isoformat()
        },
        {
            "name": "Mestre789",
            "score": 18900,
            "level": 10,
            "date": datetime.now().isoformat()
        }
    ]
    
    current_ranking = load_ranking_from_file()
    updated_ranking = merge_rankings(current_ranking, sample_entries)
    save_ranking_to_file(updated_ranking)
    
    print(f"Ranking atualizado com {len(sample_entries)} entradas de exemplo.")
    print(f"Total de entradas no ranking: {len(updated_ranking)}")

if __name__ == "__main__":
    print("=== Atualizador de Ranking Global ===")
    print("1. Adicionar dados de exemplo")
    print("2. Mostrar ranking atual")
    print("3. Limpar ranking")
    
    choice = input("Escolha uma opção (1-3): ").strip()
    
    if choice == "1":
        add_sample_data()
    elif choice == "2":
        ranking = load_ranking_from_file()
        if ranking:
            print(f"\nRanking atual ({len(ranking)} entradas):")
            for i, entry in enumerate(ranking[:10], 1):
                date = datetime.fromisoformat(entry['date']).strftime('%d/%m/%Y')
                print(f"{i:2d}º {entry['name']:15s} - {entry['score']:6d} pts (Nível {entry['level']}) - {date}")
            if len(ranking) > 10:
                print(f"... e mais {len(ranking) - 10} entradas")
        else:
            print("\nNenhuma entrada no ranking.")
    elif choice == "3":
        save_ranking_to_file([])
        print("Ranking limpo com sucesso.")
    else:
        print("Opção inválida.")