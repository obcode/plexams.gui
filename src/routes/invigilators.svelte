<script context="module">
import { request, gql } from 'graphql-request'

const query = gql`
query {
  invigilators {
    fullname
    shortname
    isProf
    isLBA
    isProfHC
    isStaff
    lastSemester
    fk
	id
    email
  }
}
`

export const load = async () => {
    const data = await request('http://localhost:8080/query', query)
    
    return {
        props: {
            data
        }
    }
}

</script>

<script>
    export let data
</script>

<h1>
    Aufsichten
</h1>

<ol>
    {#each data.invigilators as invigilator}
    <li>{invigilator.shortname}
        (<b>{invigilator.lastSemester}</b>)
    </li>
    {/each}
</ol>