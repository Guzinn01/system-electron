# api/logic.py
def determinar_categoria(nome_grupo: str, administradora: str) -> str:
    """
    Determina a categoria de um grupo combinando o tipo do bem com a administradora.
    Ex: "Imovel - Porto", "Automovel - Itaú"
    """
    nome_grupo_normalizado = str(nome_grupo).strip().upper()
    admin_normalizada = administradora.strip().lower().replace("_", "")

    categoria_base = "Outros"  # Categoria padrão se nenhuma regra específica se aplicar
    admin_reconhecida = True

    # ====================================================
    #           LÓGICA PARA A PORTO SEGURO
    # ====================================================
    if admin_normalizada in ['porto', 'portoseguro']:
        if nome_grupo_normalizado.startswith(('CA', '0I', 'I')):
            categoria_base = "Imovel"
        elif nome_grupo_normalizado.startswith('VP'):
            categoria_base = "Automovel Pesado"
        elif nome_grupo_normalizado.startswith(('A', 'AF', 'PF', 'BM')):
            categoria_base = "Automovel"

        admin_formatada = "Porto"  # Nome padronizado que aparecerá no banco

    # ====================================================
    #           LÓGICA PARA O ITAÚ
    # ====================================================
    elif admin_normalizada in ['itau', 'itaú']:
        if nome_grupo_normalizado.startswith('40'):
            categoria_base = "Imovel"
        elif nome_grupo_normalizado.startswith(('20', '50')):
            categoria_base = "Automovel"

        admin_formatada = "Itaú"  # Nome padronizado que aparecerá no banco

    # ====================================================
    #           LÓGICA PARA O BRADESCO (Exemplo futuro)
    # ====================================================
    elif admin_normalizada in ['bradesco']:
        if nome_grupo_normalizado.startswith('IMOB'):
            categoria_base = "Imovel"
        elif nome_grupo_normalizado.startswith(('CAR', 'MOTO')):
            categoria_base = "Automovel"

        admin_formatada = "Bradesco"

    # Se a administradora não for nenhuma das acima
    else:
        admin_reconhecida = False

    # --- Construção do Nome Final da Categoria ---
    if not admin_reconhecida:
        return "Administradora Desconhecida"
    else:
        # Combina a categoria base com o nome formatado da administradora
        return f"{categoria_base} - {admin_formatada}"